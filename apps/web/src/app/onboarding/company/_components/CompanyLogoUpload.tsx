'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, Check, Loader2, X, Building2 } from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';

interface CompanyLogoUploadProps {
  logoUrl?: string;
  onLogoChange: (url?: string) => void;
}

export function CompanyLogoUpload({ logoUrl, onLogoChange }: CompanyLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const res = await apiClient.post<{ logoUrl?: string; data?: { logoUrl?: string } }>(
        '/organizations/logo',
        formData
      );

      const finalUrl = res?.logoUrl || res?.data?.logoUrl;
      if (finalUrl) {
        onLogoChange(finalUrl);
      } else {
        throw new Error('Upload completed but no URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload company logo to S3.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onLogoChange(undefined);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black uppercase tracking-wider text-slate-200">
        Company Logo
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center shrink-0 shadow-inner">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Company Logo"
              fill
              sizes="64px"
              className="object-contain p-1.5"
              unoptimized
            />
          ) : (
            <Building2 className="h-7 w-7 text-slate-600" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-xs">
              <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {logoUrl ? 'Logo Uploaded' : 'Upload Organization Brand'}
            </span>
            {logoUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Check className="h-3 w-3" /> S3 Synced
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            PNG, JPG, SVG or WebP up to 5MB. Displayed on jobs and candidate portals.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {logoUrl ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Remove logo"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-700/80 transition-all cursor-pointer hover:border-orange-500/40 shadow-sm disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4 text-orange-400" />
              <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
    </div>
  );
}
