import { Transform } from "class-transformer";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";
import { ReplyStatus } from "@prisma/client";

/** Query params for the review inbox. All optional — omitted means "no filter". */
export class ReviewFiltersDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  /** Filters by the status of the review's reply, which is what the
   *  dashboard tabs ("Needs approval", "Auto-replied") actually mean. */
  @IsOptional()
  @IsEnum(ReplyStatus)
  replyStatus?: ReplyStatus;

  /** Free-text search across reviewer name and review body. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  @Transform(({ value }) => value === "true")
  needsApproval?: boolean;
}
