import { Injectable, Logger } from "@nestjs/common";
import { ReplyStatus, RiskLevel } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { selectReplyDraft } from "../replies/reply-templates";
import { SentimentRiskService } from "../safety/sentiment-risk.service";
import { ReviewsService, ReviewWithDetail } from "./reviews.service";

/**
 * Takes a stored review and runs it through assess risk -> select the client's
 * approved reply template -> route to draft or human approval.
 *
 * Reply text is NOT generated. It is chosen verbatim from the client's approved
 * BirdEye templates (see ../replies/reply-templates.ts) and only the reviewer's
 * first name is filled in.
 *
 * DRAFT ONLY: nothing is posted to Google here. BirdEye is still the live
 * system of record, so every result is a draft on the dashboard for a person to
 * see. No reply is marked POSTED by this pipeline.
 */
@Injectable()
export class ReviewProcessorService {
  private readonly logger = new Logger(ReviewProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
    private readonly risk: SentimentRiskService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Processes everything still awaiting a draft. Returns how many succeeded. */
  async processPending(): Promise<{ processed: number; failed: number }> {
    const pending = await this.reviews.findUnprocessed();
    let processed = 0;
    let failed = 0;

    for (const review of pending) {
      try {
        await this.processOne(review);
        processed++;
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to process review ${review.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { processed, failed };
  }

  async processOne(review: ReviewWithDetail): Promise<void> {
    const assessment = this.risk.assess(review.rating, review.reviewText);

    await this.prisma.reviewAnalysis.upsert({
      where: { reviewId: review.id },
      update: {
        sentiment: assessment.sentiment,
        riskLevel: assessment.riskLevel,
        riskFlags: assessment.riskFlags,
      },
      create: {
        reviewId: review.id,
        sentiment: assessment.sentiment,
        riskLevel: assessment.riskLevel,
        riskFlags: assessment.riskFlags,
      },
    });

    const selection = selectReplyDraft({
      brandName: review.location.brand.name,
      rating: review.rating,
      reviewText: review.reviewText,
      reviewerName: review.reviewerName,
      seed: review.externalReviewId || review.id,
    });

    // Status, draft-only. Nothing is posted to Google from here.
    //  - No approved template, or the review is high risk (low rating or a
    //    flagged topic, e.g. a 5-star review that mentions rude staff):
    //    hold for a person -> PENDING_APPROVAL.
    //  - Safe positive with an approved template: ready draft on the dashboard
    //    -> GENERATED. It is NOT auto-posted while BirdEye is still live.
    const holdForPerson = !selection.draft || assessment.riskLevel === RiskLevel.HIGH;
    const status = holdForPerson ? ReplyStatus.PENDING_APPROVAL : ReplyStatus.GENERATED;

    // When there is no approved wording, surface the reason as the draft so the
    // person knows to write it manually rather than seeing an empty box.
    const draftText = selection.draft ?? (selection.note ?? "No approved template for this case. Please write a reply manually.");

    await this.prisma.reply.upsert({
      where: { reviewId: review.id },
      update: { aiDraft: draftText, status, aiProvider: "template", aiModel: "birdeye-approved-v1" },
      create: {
        reviewId: review.id,
        aiDraft: draftText,
        status,
        aiProvider: "template",
        aiModel: "birdeye-approved-v1",
      },
    });

    await this.reviews.markProcessed(review.id);

    if (status === ReplyStatus.PENDING_APPROVAL) {
      const reason = selection.draft ? assessment.reason : (selection.note ?? assessment.reason);
      await this.notifications.notifyNeedsApproval(review, reason);
    }

    this.logger.log(
      `Review ${review.id} (${review.rating}star, ${selection.category}) -> ${status}` +
        (selection.variant ? ` [template variant ${selection.variant}]` : " [no approved template]"),
    );
  }
}
