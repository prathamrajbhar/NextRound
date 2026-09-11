import { z } from 'zod';

export const OrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  logoUrl: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  logoUrl: z.string().url().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
  availabilityHours: z.record(z.string(), z.unknown()).optional(),
});

export const OrganizationSettingsSchema = z.object({
  auto_offer: z.boolean().optional(),
  email_templates: z.record(z.string(), z.unknown()).optional(),
  notification_prefs: z.record(z.string(), z.unknown()).optional(),
});

export const MemberInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['hr']).default('hr'),
});

export const HRProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().max(25_000_000).optional().nullable(),
  timezone: z.string().optional(),
  linkedinUrl: z.string().max(1000).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  specialties: z.array(z.string()).optional(),
});

export type OrganizationInput = z.infer<typeof OrganizationSchema>;
export type OrganizationUpdateInput = z.infer<typeof OrganizationUpdateSchema>;
export type OrganizationSettingsInput = z.infer<typeof OrganizationSettingsSchema>;
export type MemberInviteInput = z.infer<typeof MemberInviteSchema>;
export type HRProfileUpdateInput = z.infer<typeof HRProfileUpdateSchema>;
