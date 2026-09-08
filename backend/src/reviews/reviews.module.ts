import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SafetyModule } from "../safety/safety.module";
import { ReviewProcessorService } from "./review-processor.service";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [AiModule, SafetyModule, NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewProcessorService],
  exports: [ReviewsService, ReviewProcessorService],
})
export class ReviewsModule {}
