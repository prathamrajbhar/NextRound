import { z } from 'zod';

export const CandidateEmbeddingSchema = z
  .object({
    embedding: z.array(z.number()).length(768).optional(),
  })
  .passthrough();

export const CandidateEmbeddingsSchema = z
  .object({
    sections: z
      .array(
        z
          .object({
            sourceType: z.enum(['resume', 'github', 'linkedin', 'profile']).optional(),
            source_type: z.enum(['resume', 'github', 'linkedin', 'profile']).optional(),
            section: z.string().min(1),
            content: z.string().min(1),
            contentHash: z.string().min(1),
            content_hash: z.string().min(1).optional(),
            embedding: z.array(z.number()).length(768),
          })
          .passthrough()
      )
      .max(50),
  })
  .passthrough();
