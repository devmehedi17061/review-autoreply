/**
 * Client-approved reply templates, taken verbatim from the BirdEye auto-reply
 * document ("ACE & MST | BirdEye Auto Replies | Thank you & Apology").
 *
 * These are the exact wordings the client uses today. The system fills in the
 * reviewer's first name and picks the right template by brand + scenario. No
 * wording is generated or altered.
 *
 * Scenario key: <positive|negative>_<comment|noComment>
 *  - positive  = rating >= 4   (Thank you)
 *  - negative  = rating <= 3   (Apology)
 *  - comment   = the review has written text
 *
 * autoPostable = the client has approved this scenario for automatic posting.
 * Negatives are never auto-postable: they are drafted as a suggestion and held
 * for a person, matching how BirdEye is run today.
 */

export type ReplyCategory =
  | "positive_comment"
  | "positive_noComment"
  | "negative_comment"
  | "negative_noComment";

interface BrandReplyKit {
  phone: string;
  templates: Record<ReplyCategory, string[]>;
}

const ACE_PHONE = "1800 456 094";
const MST_PHONE = "1800 754 557";

/**
 * Note on gaps, kept deliberately:
 *  - ACE "positive_noComment" is blank in the source document, so there is no
 *    approved wording. Those reviews are held for a person rather than guessed.
 *  - MST "negative_comment" is marked DO NOT USE in the source document, so it
 *    is intentionally left empty and those reviews are held for a person.
 */
const REPLY_KITS: Record<string, BrandReplyKit> = {
  "ACE Training": {
    phone: ACE_PHONE,
    templates: {
      positive_noComment: [],
      positive_comment: [
        `Hi [Name],\nThank you for your wonderful feedback. We are thrilled to hear that you enjoyed your training and that our team made a real difference in your learning. It is great to know you felt supported and confident throughout the course.\nWe would love to have you back in future courses. Let us know if you need any additional details by calling us on ${ACE_PHONE}.`,
        `Hi [Name],\nWe really appreciate your kind words. It is fantastic to hear that your time with ACE Training was a positive one and that our trainers helped you achieve your goals.\nWe would love to have you back in future courses. Let us know if you need any additional details by calling us on ${ACE_PHONE}.`,
      ],
      negative_noComment: [
        `Hi [Name],\nWe are sorry to hear your experience with ACE Training was not as expected. Since no details were shared, we would really appreciate it if you could call us on ${ACE_PHONE}.\nYour feedback will help us understand what happened and improve for future students.`,
        `Hi [Name],\nWe are sorry your experience did not meet your expectations. Without knowing the details, it is hard for us to fully understand what happened. If you are open to it, please contact us on ${ACE_PHONE} so we can listen to your feedback and make things better.`,
      ],
      negative_comment: [
        `Hi [Name],\nWe are very sorry to hear about your disappointing experience. We appreciate you sharing your concerns and we want you to know that we take this feedback seriously.\nPlease call us on ${ACE_PHONE} so we can discuss your experience in detail and see how we can address your concerns.`,
        `Hi [Name],\nThank you for your feedback. We are sorry we did not meet your expectations and that your experience left you feeling disappointed. We are committed to reviewing your concerns and making improvements.\nPlease reach out to us directly on ${ACE_PHONE} so we can speak with you personally and work towards a resolution.`,
      ],
    },
  },
  MultiSkills: {
    phone: MST_PHONE,
    templates: {
      positive_noComment: [
        `Hi [Name],\nThank you for taking the time to leave us a rating. We are so pleased to know that your training experience at MultiSkills Training met your expectations. Our trainers work hard to ensure every course is clear, practical, and supportive, and it is wonderful to see that reflected in your feedback.\nWe would love to have you back in future courses. Let us know if you need any additional details by calling us on ${MST_PHONE}.`,
        `Hi [Name],\nThanks for sharing your rating with us. We are glad to know that your time with MultiSkills Training was a positive one. Your support means a lot to us and motivates our trainers to continue delivering high-quality learning.\nWe would love to have you back in future courses. Let us know if you need any additional details by calling us on ${MST_PHONE}.`,
      ],
      positive_comment: [
        `Hi [Name],\nThank you for sharing your positive experience with us. We are thrilled to hear that you enjoyed your recent course at MultiSkills Training and that your trainer made such a strong impact on your learning. It is fantastic to know that their professionalism, patience, and knowledge supported your journey and helped you feel confident throughout the course.\nWe truly value your feedback and are grateful for your support. We would love to have you back in future courses, and if you need any additional details, please call us on ${MST_PHONE}.`,
        `Hi [Name],\nWe really appreciate your kind words and recommendations. It is great to hear that you had such a rewarding training experience and that your instructor's teaching style made the course both effective and enjoyable. Providing high-quality training and excellent trainers is our top priority, and we are so pleased this was reflected in your experience.\nWe would love to have you back in future courses. If you need any more information, please contact us on ${MST_PHONE}.`,
      ],
      negative_noComment: [
        `Hi [Name],\nSorry to hear that your experience with MultiSkills Training was not what you expected. We take our courses and student support very seriously, and it is concerning when someone feels we have not met that standard.\nWe would really like to understand more about your experience. Please contact us on ${MST_PHONE} and we will gladly assist you.`,
        `Hi [Name],\nThank you for leaving a review. We are sorry to hear you were not satisfied with your experience. Without details it is hard for us to know what went wrong, but we want to listen and improve where needed.\nIf you are open to it, please call our office on ${MST_PHONE} so we can speak with you directly.`,
      ],
      // Marked DO NOT USE in the source document - intentionally empty.
      negative_comment: [],
    },
  },
};

/** Aliases so a location's brand name variants still resolve to a kit. */
const BRAND_ALIASES: Record<string, string> = {
  "ACE Training": "ACE Training",
  ACE: "ACE Training",
  MultiSkills: "MultiSkills",
  "MultiSkills Training": "MultiSkills",
  "MultiSkill": "MultiSkills",
};

export interface ReplyDraftResult {
  /** The approved reply text with the name filled in, or null if none applies. */
  draft: string | null;
  category: ReplyCategory;
  /** Which stored variant was used (1-based), or null when none applied. */
  variant: number | null;
  /** True only for scenarios the client approved for automatic posting. */
  autoPostable: boolean;
  /** Plain-English note for the dashboard when no approved template exists. */
  note?: string;
}

function firstName(reviewerName: string): string {
  const first = (reviewerName || "").trim().split(/\s+/)[0]?.replace(/[^A-Za-z'-]/g, "");
  return first && first.length > 0 ? first : "there";
}

function categoryFor(rating: number, reviewText: string): ReplyCategory {
  const positive = rating >= 4;
  const hasComment = (reviewText || "").trim().length > 0;
  if (positive) return hasComment ? "positive_comment" : "positive_noComment";
  return hasComment ? "negative_comment" : "negative_noComment";
}

/** Stable pick so the same review always maps to the same variant. */
function pickVariant(seed: string, count: number): number {
  if (count <= 1) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % count;
}

/**
 * Selects the client-approved reply for a review and fills in the first name.
 * Returns draft = null when the client has no approved wording for that case
 * (ACE positive-with-no-comment, or MST negative-with-comment) so the caller
 * holds it for a person instead of posting anything.
 */
export function selectReplyDraft(input: {
  brandName: string;
  rating: number;
  reviewText: string;
  reviewerName: string;
  seed: string;
}): ReplyDraftResult {
  const category = categoryFor(input.rating, input.reviewText);
  const isPositive = category.startsWith("positive");
  const kitKey = BRAND_ALIASES[input.brandName.trim()] ?? input.brandName.trim();
  const kit = REPLY_KITS[kitKey];

  if (!kit) {
    return { draft: null, category, variant: null, autoPostable: false, note: `No approved reply set for brand "${input.brandName}".` };
  }

  const variants = kit.templates[category];
  if (!variants || variants.length === 0) {
    const note =
      category === "negative_comment"
        ? "No approved template for this case (marked do-not-use). Please write a reply manually."
        : "No approved template for this case. Please write a reply manually.";
    return { draft: null, category, variant: null, autoPostable: false, note };
  }

  const idx = pickVariant(input.seed, variants.length);
  const draft = variants[idx].replace(/\[Name\]/g, firstName(input.reviewerName));
  // Only positive scenarios are approved for automatic posting; negatives are
  // always drafted and held for a person, matching current BirdEye practice.
  return { draft, category, variant: idx + 1, autoPostable: isPositive };
}
