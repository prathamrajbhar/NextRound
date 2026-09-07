import { z } from 'zod';

export const VoiceRespondPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().optional(),
  audioUrl: z.string().optional(),
  questionNumber: z.number().optional().default(1),
  stage: z.string().optional(),
});

export type VoiceRespondPayloadInput = z.infer<typeof VoiceRespondPayloadSchema>;
