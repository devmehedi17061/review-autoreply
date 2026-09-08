import { Inject, Injectable, Logger } from "@nestjs/common";
import { ReplyStatus, RiskLevel } from "@prisma/client";
import { BrandPromptBuilder } from "../ai/prompts/brand-prompt.builder";
import { AI_PROVIDER, AiProvider } from "../ai/providers/ai-provider.interface";
import { PrismaService } from "../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SentimentRiskService } from "../safety/sentiment-risk.service";
import { ReviewsService, ReviewWithDetail } from "./reviews.service";

/**
 * The heart of the system: takes a stored review and runs it through
 * assess risk → generate reply → route to auto-post or human approval.
 *
 * Deliberately ordered risk-first. Assessing before generating means a review
 * that must go to a human is flagged even if the AI provider is down or out
 * of credit — the safety decision never depends on a third party being up.
 */
@Injectable()
export class ReviewProcessorService {
  private readonly logger = new Logger(ReviewProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
    private readonly risk: SentimentRiskService,
    private readonly promptBuilder: BrandPromptBuilder,
    private readonly notifications: NotificationsService,
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
  ) {}

  /** Processes everything still awaiting a reply. Returns how many succeeded. */
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

    const systemPrompt = this.promptBuilder.build(review.location.brand, review.location, review.rating);
    const draft = await this.ai.generateReply({
      systemPrompt,
      reviewerName: review.reviewerName,
      rating: review.rating,
      reviewText: review.reviewText,
    });

    // High risk is held for a person; low risk is approved for posting.
    const status = assessment.riskLevel === RiskLevel.HIGH ? ReplyStatus.PENDING_APPROVAL : ReplyStatus.APPROVED;

    await this.prisma.reply.upsert({
      where: { reviewId: review.id },
      update: { aiDraft: draft, status, aiProvider: this.ai.name, aiModel: this.ai.model },
      create: {
        reviewId: review.id,
        aiDraft: draft,
        status,
        aiProvider: this.ai.name,
        aiModel: this.ai.model,
      },
    });

    await this.reviews.markProcessed(review.id);

    if (status === ReplyStatus.PENDING_APPROVAL) {
      await this.notifications.notifyNeedsApproval(review, assessment.reason);
    }

    this.logger.log(`Review ${review.id} (${review.rating}★) → ${status}`);
  }
}
