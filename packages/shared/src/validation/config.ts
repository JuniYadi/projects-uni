import { z } from "zod"

export const wireGuardConfigSchema = z.object({
  privateKey: z.string().min(1),
  publicKey: z.string().min(1),
  serverAddress: z.string().min(1),
  serverPort: z.number().int().positive(),
  address: z.union([z.string(), z.array(z.string())]).optional(),
  allowedIPs: z.array(z.string()).min(1),
  dns: z.array(z.string()).optional(),
  mtu: z.number().int().positive().optional(),
  presharedKey: z.string().optional(),
})
