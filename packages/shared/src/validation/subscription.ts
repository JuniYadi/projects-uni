import { z } from "zod"

export const subscriptionIdSchema = z.string().min(1, "Subscription ID is required")

export const subscriptionValidateRequestSchema = z.object({
  subscriptionId: subscriptionIdSchema,
})

export const loginRequestSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  deviceName: z.string().min(1, "Device name is required"),
  deviceFingerprint: z.string().min(1, "Device fingerprint is required"),
  platform: z.string().min(1, "Platform is required"),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
})
