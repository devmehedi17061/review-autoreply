import { PrismaClient } from "@prisma/client";

/**
 * Seeds the exact Birdeye auto-reply configuration (captured 22 Sep 2026 from
 * the client's live account, authored by Larissa Tan). See docs/birdeye-export.md.
 *
 * Templates keep Birdeye's ${Reviewer first name} placeholder verbatim so what
 * staff see here matches Birdeye; the drafting engine fills in the first name.
 *
 * Idempotent: clears this brand's templates + rules and recreates them.
 */
const prisma = new PrismaClient();

type Comment = "PRESENT" | "ABSENT" | "ANY";

interface TemplateSeed {
  name: string;
  body: string;
}
interface RuleSeed {
  name: string;
  ratings: number[];
  comment: Comment;
  delayHours: number;
  templateNames: string[];
  rank: number;
}
interface BrandConfig {
  brandName: string;
  createdBy: string;
  templates: TemplateSeed[];
  rules: RuleSeed[];
}

// ── ACE Training ────────────────────────────────────────────────────────────
const ACE: BrandConfig = {
  brandName: "ACE Training",
  createdBy: "Larissa Tan",
  templates: [
    { name: "2, 1 Stars Without Comment - Reply A", body: `\${Reviewer first name}, thank you for taking the time to leave us a review. We're sorry to hear we didn't meet your expectations this time, but we truly appreciate you letting us know. Your feedback helps us improve, and we hope to have the opportunity to welcome you back and provide a better experience in the future. Wishing you all the best in your career ahead. From, The ACE Training Team` },
    { name: "2, 1 Stars Without Comment - Reply B", body: `Thank you for taking the time to leave us a review, \${Reviewer first name}. We truly appreciate you taking the time to let us know how you feel, and we're sorry to see that we didn't quite meet your expectations this time. Your feedback will help us improve, and we hope to have the opportunity to provide a better experience in the future. Wishing you all the best in your career ahead. From, The ACE Training Team` },
    { name: "3 Stars Without Comment - Reply A", body: `\${Reviewer first name}, thank you for taking the time to leave us a review. 🙂 We're sorry to hear we didn't quite meet your expectations this time, but we truly appreciate your feedback and will use it to keep improving. Your support means a lot to us, and we hope to have the opportunity to have you back. Wishing you all the best in your career. 💪 From, The ACE Training Team` },
    { name: "3 Stars Without Comment - Reply B", body: `Thank you, \${Reviewer first name}, for taking the time to leave us a review. 🙂 We didn't quite meet your expectations this time, but your feedback will help us keep improving. Your support means a lot to us, and we hope to have the opportunity to have you back. Wishing you all the best in your career 💪. From, The ACE Training Team` },
    { name: "4 Stars Without Comment - Reply A", body: `\${Reviewer first name}, thank you so much for leaving us a review. 😁 We're glad to hear you had a positive experience at ACE Training, and your feedback motivates us to keep improving and delivering the best possible training for our students. We truly appreciate your support and hope to welcome you back again in the future. 🙌 Wishing you every success in your career. 🚀 From, The ACE Training Team` },
    { name: "4 Stars Without Comment - Reply B", body: `Thank you so much, \${Reviewer first name}, for leaving us a review. 😌 Your feedback motivates us to keep improving and delivering the best possible training for our students. We're also glad to hear you had a positive experience with our team. Looking forward to welcoming you back again in the future 🙌. Wishing you every success in your career 🚀. From, The ACE Training Team` },
    { name: "5 Stars Without Comment - Reply A", body: `\${Reviewer first name}, thank you for taking the time to give us a 5-star review. 🌟 We continuously strive to give our students the best possible learning experience, and we're thrilled to know we met your expectations. We look forward to having you back to train with us. Thank you for choosing ACE Training. Wishing you the very best in your career. 🙏 From, The ACE Training Team` },
    { name: "5 Stars Without Comment - Reply B", body: `Thank you for giving us a 5-star review, \${Reviewer first name}. 😊 We are happy to know that our continuous effort to provide quality training for our students is working. We would love to have you train with us again. Thank you for choosing ACE Training. All the best in your career. 🙌 From, The ACE Training Team` },
    { name: "3 Stars With Comment - Reply A", body: `Thank you for sharing your experience, \${Reviewer first name}. 🙂 Your feedback helps us improve and deliver the best possible training for our students. 💪 If you are willing to share more, feel free to contact us at 1800 456 094. We hope to welcome you back and train with us again. 🙌 Wishing you every success in your career. 🚀 From, The ACE Training Team` },
    { name: "3 Stars With Comment - Reply B", body: `Thank you, \${Reviewer first name}, for sharing your thoughts 🙂. We deliver the best possible training for our students because of valuable feedback like yours, and they will be taken into consideration for future improvements. If you are open to sharing more, feel free to contact us at 1800 456 094. We hope to have you train with us again 🙌. Wishing you all the best in your career 🚀. From, The ACE Training Team` },
    { name: "4 Stars With Comment - Reply A", body: `Thank you so much, \${Reviewer name}, for taking the time to share your positive review. 😃 We're glad to hear you had a good experience with us. Feedback like yours helps us continue to improve and deliver the best possible training for our students. We truly value your support and look forward to welcoming you back again in the future. 🙌 Wishing you every success in your career. 🚀 From, The ACE Training Team` },
    { name: "4 Stars With Comment - Reply B", body: `Thank you for taking the time to give us a positive review, \${Reviewer first name}. 😀 It's great to know you had a good time with us. Your support and feedback encourages us to keep improving to give our students the best possible experience. We'd love to welcome you back again in the future. 🙌 We wish you all the best as you move forward in your career. 🙏 From, The ACE Training Team` },
    { name: "5 Stars With Comment - Reply A", body: `Thank you so much, \${Reviewer first name}, for taking the time to share such a kind and positive review. 😊 We're thrilled to hear about your fantastic experience with us. Our goal is always to provide a top-notch learning environment that helps our students succeed, and we're delighted to know we met your expectations. Your support means a great deal to us, and we look forward to welcoming you back in the future. Thank you for choosing ACE Training. Wishing you the very best in your career. 🙏 From, The ACE Training Team` },
    { name: "5 Stars With Comment - Reply B", body: `Thank you so much for leaving such a thoughtful review, \${Reviewer first name}. 😁 Hearing about your experience with us truly makes our day and reminds us why we do what we do. Our goal is always to provide top-quality training so our students succeed, and we're thrilled to know we met your expectations. We appreciate your support and look forward to welcoming you back in the future. Wishing you every success in your career. 🙏 From, The ACE Training Team` },
    { name: "5 Stars With Comment - Reply C", body: `\${Reviewer first name}, we're so grateful you took the time to share your experience with us. 🙏 Knowing that your training with us was so positive means a great deal to our team. ❤️ Every review like yours reminds us why we're passionate about supporting students in reaching their goals. Thank you for trusting ACE Training with your learning journey. We wish you continued success in your career 🚀 and look forward to seeing you again in the future. From, The ACE Training Team` },
    { name: "5 Stars With Comment - Reply D", body: `\${Reviewer first name}, your feedback truly brightened our day! 🌟 It's wonderful to hear that you had such a rewarding experience with us. At ACE Training, we believe that learning should be supportive, challenging, and rewarding, and it's fantastic to know that came through in your training. We appreciate your kind words and your support. 🤝 All the very best as you continue to grow in your career 💪, and we hope to welcome you back. From, The ACE Training Team` },
  ],
  rules: [
    { name: "Reply to 2 and 1 Stars Without Comment", ratings: [1, 2], comment: "ABSENT", delayHours: 4, rank: 60, templateNames: ["2, 1 Stars Without Comment - Reply A", "2, 1 Stars Without Comment - Reply B"] },
    { name: "Reply to 3 Stars Without Comment", ratings: [3], comment: "ABSENT", delayHours: 24, rank: 50, templateNames: ["3 Stars Without Comment - Reply A", "3 Stars Without Comment - Reply B"] },
    { name: "Reply to 4 Stars Without Comment", ratings: [4], comment: "ABSENT", delayHours: 24, rank: 40, templateNames: ["4 Stars Without Comment - Reply A", "4 Stars Without Comment - Reply B"] },
    { name: "Reply to 5 Stars Without Comment", ratings: [5], comment: "ABSENT", delayHours: 24, rank: 30, templateNames: ["5 Stars Without Comment - Reply A", "5 Stars Without Comment - Reply B"] },
    { name: "Reply to 3 Stars With Comment", ratings: [3], comment: "PRESENT", delayHours: 24, rank: 50, templateNames: ["3 Stars With Comment - Reply A", "3 Stars With Comment - Reply B"] },
    { name: "Reply to 4 Stars With Comment", ratings: [4], comment: "PRESENT", delayHours: 24, rank: 40, templateNames: ["4 Stars With Comment - Reply A", "4 Stars With Comment - Reply B"] },
    { name: "Reply to 5 Stars With Comment", ratings: [5], comment: "PRESENT", delayHours: 24, rank: 30, templateNames: ["5 Stars With Comment - Reply A", "5 Stars With Comment - Reply B", "5 Stars With Comment - Reply C", "5 Stars With Comment - Reply D"] },
  ],
};

// ── MultiSkills Training ────────────────────────────────────────────────────
const MST: BrandConfig = {
  brandName: "MultiSkills",
  createdBy: "Larissa Tan",
  templates: [
    { name: "2, 1 Stars Without Comment - Reply A", body: `Hey \${Reviewer first name}, thanks for leaving a review. We're sorry to know things didn't go as well as we'd hoped. 🙏 Your feedback helps us learn and keep improving the experience for every student. Only if you're up for it, please reach out to us at 1800 754 557. We'd like to chat and learn more. We'd appreciate the chance to welcome you back in the future and turn things around. All the best with your training and career ahead 💪 Cheers, The MultiSkills Training Team` },
    { name: "2, 1 Stars Without Comment - Reply B", body: `Hi \${Reviewer first name}, 👋 Thanks for sharing your feedback, we really appreciate you taking the time to let us know about your experience. 🙏 We're sorry to hear things didn't go as expected, and we'd like to understand what happened so we can make it right and improve for the future. If you're open to it, please reach out to us at 1800 754 557. We'd like the chance to chat and learn more. Hoping that you'll come back again and allow us to turn things around. We wish you all the best as you continue building your career. 🚀 Take care, The MultiSkills Training Team` },
    { name: "3 Stars Without Comment - Reply A", body: `Hey \${Reviewer first name}, thanks for leaving a review! 🙂 We really appreciate the feedback, even a quick rating helps us see how we're doing and where we can lift our game. If you're up for it, feel free to reach out at 1800 754 557, we'd love to hear from you. We'd love to have you back again sometime. All the best with your career. 🚀 Cheers, The MultiSkills Training Team` },
    { name: "3 Stars Without Comment - Reply B", body: `Hi \${Reviewer first name}, 👋 Thanks for leaving us a review, we really appreciate the feedback. We're sorry to hear your experience was just okay, and we'd love the chance to learn what we could've done better. Your input helps us keep improving and deliver the best possible training for our students. 💪 If you're happy to share more, feel free to reach out at 1800 754 557, we'd love to hear from you. Wishing you all the best as you continue building your career! 🚀 Take care, The MultiSkills Training Team` },
    { name: "4 Stars Without Comment - Reply A", body: `Thanks so much for the review, \${Reviewer first name}! 😁 We're happy that you had a great experience with us. We really appreciate your support and hope to see you back again soon 🙌. Wishing you the best in your career. 🚀 Cheers, The MultiSkills Training Team` },
    { name: "4 Stars Without Comment - Reply B", body: `\${Reviewer first name}, thanks for the 4 stars! ⭐⭐⭐⭐ We really appreciate you taking the time to leave a review — it's great to know you had a good time training with us. 🙌 Wishing you all the best as you continue building your career! 🚀 Take care, The MultiSkills Training Team` },
    { name: "5 Stars Without Comment - Reply A", body: `Thanks so much, \${Reviewer first name}, for the awesome 5-star review! 🌟 We're stoked that you had such a great experience with us — that's exactly what we aim for every day. We really appreciate your support and hope to see you back for more training soon. Wishing you all the best in your career. 🙌 Cheers, The MultiSkills Training Team` },
    { name: "5 Stars Without Comment - Reply B", body: `\${Reviewer first name}, thanks so much for the 5 stars! ⭐⭐⭐⭐⭐ We really appreciate your support, and it means a lot to the team. All the best as you continue building your career — we're cheering you on! 🚀 Take care, The MultiSkills Training Team` },
    { name: "3 Stars With Comment - Reply A", body: `Thanks for sharing your experience, \${Reviewer first name}! 🙂 We really appreciate your feedback — it helps us keep improving and give our students the best possible training. If you're open to sharing more, please get in touch at 1800 754 557 — we're always happy to listen and get better. We'd love to have you back again in the future. Wishing you all the best as you continue building your career 🚀 Cheers, The MultiSkills Training Team` },
    { name: "3 Stars With Comment - Reply B", body: `Hi \${Reviewer first name}, 👋 Thanks for sharing your thoughts — we really appreciate you taking the time to leave a review. We're sorry to hear your experience wasn't as smooth as it should've been, and we'd love to learn a bit more so we can keep improving. 🙏 If you're happy to chat, feel free to get in touch at 1800 754 557 — we're always keen to listen and make things better. Thanks again for your feedback, and we hope to see you again in the future. 🙂 Take care, The MultiSkills Training Team` },
    { name: "4 Stars With Comment - Reply A", body: `Thanks so much, \${Reviewer first name}, for leaving us a great review 😃 We're really happy to hear you had a good experience with us! Your feedback means a lot and helps us keep improving what we do. We truly appreciate your support and hope to see you again soon. Wishing you all the best in your career journey 🚀 Cheers, The MultiSkills Training Team` },
    { name: "4 Stars With Comment - Reply B", body: `Hey \${Reviewer first name}, thanks heaps for taking the time to share your feedback! 😊 We're so glad you enjoyed your experience and really appreciate your kind words. Your review helps us keep lifting the bar and making training even better for our students. All the best with your future goals — we'd love to have you back again sometime. 🙌 Take care, The MultiSkills Training Team` },
    { name: "5 Stars With Comment - Reply A", body: `Thank you so much, \${Reviewer first name}, for your awesome review. 🥳 We're so happy to hear you had such a great experience with us! Our team always aims to make learning enjoyable and rewarding, so it's fantastic to know we hit the mark. Your support means a lot, and we'd love to see you back again in the future. Thanks for choosing MultiSkills Training, we really appreciate it! All the best with your career. 🙌 Cheers, The MultiSkills Training Team` },
    { name: "5 Stars With Comment - Reply B", body: `Thanks a bunch, \${Reviewer first name}, for the lovely review! 🎉 We're stoked to hear you had such a positive experience with us. Our team puts a lot of effort into creating a great learning environment, so it's awesome to know it paid off. We really appreciate your support and hope to see you again soon. All the best with your future goals! 💪 Cheers, The MultiSkills Training Team` },
    { name: "5 Stars With Comment - Reply C", body: `Hey \${Reviewer first name}, thanks so much for the great feedback! 😊 We're thrilled you enjoyed your time with us — that's exactly what we aim for every day. Your kind words mean a lot, and we wish you all the best as you continue building your career. 😎 Take care, The MultiSkills Training Team` },
    { name: "5 Stars With Comment - Reply D", body: `Wow, thanks heaps, \${Reviewer first name}! 🙌 We love hearing stories like yours — it makes all the hard work worth it. We're so glad you had an awesome experience training with us. Good luck with your career journey, and hopefully we'll see you again down the track! 🚀 Take care, The MultiSkills Training Team` },
  ],
  rules: [
    { name: "Reply to 2 and 1 Stars Without Comment", ratings: [1, 2], comment: "ABSENT", delayHours: 4, rank: 60, templateNames: ["2, 1 Stars Without Comment - Reply A", "2, 1 Stars Without Comment - Reply B"] },
    { name: "Reply to 3 Stars Without Comment", ratings: [3], comment: "ABSENT", delayHours: 24, rank: 50, templateNames: ["3 Stars Without Comment - Reply A", "3 Stars Without Comment - Reply B"] },
    { name: "Reply to 4 Stars Without Comment", ratings: [4], comment: "ABSENT", delayHours: 24, rank: 40, templateNames: ["4 Stars Without Comment - Reply A", "4 Stars Without Comment - Reply B"] },
    { name: "Reply to 5 Stars Without Comment", ratings: [5], comment: "ABSENT", delayHours: 24, rank: 30, templateNames: ["5 Stars Without Comment - Reply A", "5 Stars Without Comment - Reply B"] },
    { name: "Reply to 3 Stars With Comment", ratings: [3], comment: "PRESENT", delayHours: 24, rank: 50, templateNames: ["3 Stars With Comment - Reply A", "3 Stars With Comment - Reply B"] },
    { name: "Reply to 4 Stars With Comment", ratings: [4], comment: "PRESENT", delayHours: 24, rank: 40, templateNames: ["4 Stars With Comment - Reply A", "4 Stars With Comment - Reply B"] },
    { name: "Reply to 5 Stars With Comment", ratings: [5], comment: "PRESENT", delayHours: 24, rank: 30, templateNames: ["5 Stars With Comment - Reply A", "5 Stars With Comment - Reply B", "5 Stars With Comment - Reply C", "5 Stars With Comment - Reply D"] },
  ],
};

async function seedBrand(config: BrandConfig) {
  const brand = await prisma.brand.findUnique({ where: { name: config.brandName } });
  if (!brand) {
    console.warn(`Brand "${config.brandName}" not found - skipping.`);
    return;
  }

  // Idempotent reseed: clear this brand's config first.
  await prisma.autoReplyRule.deleteMany({ where: { brandId: brand.id } });
  await prisma.responseTemplate.deleteMany({ where: { brandId: brand.id } });

  const nameToId = new Map<string, string>();
  for (const t of config.templates) {
    const created = await prisma.responseTemplate.create({
      data: { brandId: brand.id, name: t.name, body: t.body, createdBy: config.createdBy },
    });
    nameToId.set(t.name, created.id);
  }

  for (const r of config.rules) {
    const templateIds = r.templateNames.map((n) => {
      const id = nameToId.get(n);
      if (!id) throw new Error(`Rule "${r.name}" references missing template "${n}"`);
      return id;
    });
    await prisma.autoReplyRule.create({
      data: {
        brandId: brand.id,
        name: r.name,
        ratings: r.ratings,
        comment: r.comment,
        delayHours: r.delayHours,
        rank: r.rank,
        templateIds,
      },
    });
  }

  console.log(`Seeded ${config.brandName}: ${config.templates.length} templates, ${config.rules.length} rules.`);
}

async function main() {
  await seedBrand(ACE);
  await seedBrand(MST);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
