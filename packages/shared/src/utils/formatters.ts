export function formatExperienceDisplay(level?: string | null): string {
  if (!level) return 'Fresher (0-2 Yrs)';
  const trimmed = level.trim();

  if (
    trimmed === 'Fresher (0-2 Years)' ||
    trimmed === 'Fresher / Entry-Level' ||
    trimmed === 'Fresher (0-2 Yrs)' ||
    trimmed.toLowerCase().includes('fresher') ||
    trimmed.toLowerCase().includes('entry')
  ) {
    return 'Fresher (0-2 Yrs)';
  }

  if (
    trimmed === 'Senior (5+ Years)' ||
    trimmed === 'Senior Specialist' ||
    trimmed.toLowerCase().includes('senior') ||
    trimmed.toLowerCase().includes('specialist')
  ) {
    return 'Senior Specialist';
  }

  if (
    trimmed === 'Mid-Level (2-5 Years)' ||
    trimmed === 'Mid-Level' ||
    trimmed.toLowerCase().includes('mid')
  ) {
    return 'Mid-Level (2-5 Yrs)';
  }

  if (
    trimmed === 'Staff / Lead (8+ Years)' ||
    trimmed === 'Staff / Tech Lead' ||
    trimmed.toLowerCase().includes('staff') ||
    trimmed.toLowerCase().includes('lead')
  ) {
    return 'Staff / Tech Lead';
  }

  return trimmed;
}
