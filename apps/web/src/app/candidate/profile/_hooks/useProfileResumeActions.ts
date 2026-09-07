'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ParsedProfilePayload } from '../_utils/profileUtils';

interface UseProfileResumeActionsOptions {
  onParsedProfile: (parsed: ParsedProfilePayload) => void;
  onError: (msg: string) => void;
  getPayload: () => Record<string, unknown>;
}

export function useProfileResumeActions({
  onParsedProfile,
  onError,
  getPayload,
}: UseProfileResumeActionsOptions) {
  const queryClient = useQueryClient();
  const [resumeName, setResumeName] = useState('No resume uploaded');
  const [resumeDate, setResumeDate] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    onError('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const parsed = await apiClient.post<{
        resumeUrl?: string;
        profile?: ParsedProfilePayload;
      }>('/candidate/profile/parse-resume', fd);

      setResumeFile(file);
      const savedUrl = parsed?.resumeUrl;
      if (savedUrl) {
        setResumeUrl(savedUrl);
        setResumeName(savedUrl.split('/').pop() || file.name);
        setResumeDate('Uploaded just now');
      }

      if (parsed?.profile) {
        onParsedProfile(parsed.profile);
      }
      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to upload and parse resume.');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm('Are you sure you want to delete your active resume?')) return;
    setUploadingResume(true);
    onError('');
    try {
      const currentData = getPayload();
      currentData.resumeUrl = null;
      currentData.rawResumeText = null;
      currentData.parsedResume = {};

      await apiClient.post('/candidate/profile', currentData);
      setResumeUrl('');
      setResumeName('No resume uploaded');
      setResumeDate('');
      queryClient.invalidateQueries({ queryKey: ['profile', 'candidate'] });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  return {
    resumeName,
    setResumeName,
    resumeDate,
    setResumeDate,
    resumeUrl,
    setResumeUrl,
    resumeFile,
    uploadingResume,
    handleResumeUpload,
    handleDeleteResume,
  };
}
