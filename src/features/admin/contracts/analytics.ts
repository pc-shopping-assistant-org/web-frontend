import {z} from "zod";

import {ANALYTICS_PERIOD_VALUES} from "@/lib/domain/assistant-enums";
import {optionalDate, optionalEnum} from "@/lib/api/contracts/primitives";

export const analyticsDateRangeRequestSchema = z.object({
  period: optionalEnum(ANALYTICS_PERIOD_VALUES),
  fromDate: optionalDate,
  toDate: optionalDate,
}).strict();

export type AnalyticsDateRangeRequest = z.infer<typeof analyticsDateRangeRequestSchema>;
