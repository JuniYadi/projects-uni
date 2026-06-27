import { z } from "zod"

export const subscriptionIdSchema = z.string().min(1, "Subscription ID is required")

export const subscriptionValidateRequestSchema = z.object({
  subscriptionId: subscriptionIdSchema,
})
