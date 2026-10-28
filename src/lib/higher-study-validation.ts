import { HigherStudyCategory } from "@prisma/client";
import { z } from "zod";

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "URL must use http or https.");

export const higherStudyResourceSchema = z.object({
  title: z.string().trim().min(3).max(200),
  category: z.enum(HigherStudyCategory),
  department: z.string().trim().max(80).nullable().optional(),
  subject: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional().transform((value) => value ?? ""),
  fileUrl: httpUrlSchema.nullable().optional(),
  videoUrl: httpUrlSchema.nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  isVerified: z.boolean().default(true),
});

export const higherStudyResourceUpdateSchema = higherStudyResourceSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, "Provide at least one field to update.");

export const higherStudySubmissionSchema = higherStudyResourceSchema.omit({ isVerified: true });

export const higherStudyModerationSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("APPROVED") }),
  z.object({
    status: z.literal("REJECTED"),
    rejectionReason: z.string().trim().min(1).max(1000),
  }),
]);

export type HigherStudyResourceInput = z.infer<typeof higherStudyResourceSchema>;
