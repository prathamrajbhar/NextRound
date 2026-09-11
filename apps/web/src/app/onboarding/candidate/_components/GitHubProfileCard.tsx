'use client';

import React from 'react';
import { ExternalLink, Star, Code, GithubIcon } from '@/lib/lucide-google-icons';

export interface GitHubRepo {
  name: string;
  url: string;
  stars: number;
  description?: string;
}

export interface GitHubProfileData {
  avatarUrl?: string;
  username?: string;
  name?: string;
  profileUrl?: string;
  publicRepos?: number;
  totalStars?: number;
  bio?: string;
  topLanguages?: string[];
  repositories?: GitHubRepo[];
}

interface GitHubProfileCardProps {
  ghData: GitHubProfileData;
}

export function GitHubProfileCard({ ghData }: GitHubProfileCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          {ghData.avatarUrl ? (
            <img src={ghData.avatarUrl} alt={ghData.username} className="h-9 w-9 rounded-full border border-orange-500/40" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <GithubIcon className="h-4.5 w-4.5" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>{ghData.name || ghData.username}</span>
              <a href={ghData.profileUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </h4>
            <p className="text-xs text-slate-400">@{ghData.username} • {ghData.publicRepos} Repositories</p>
          </div>
        </div>

        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-300 text-xs font-bold px-3 py-1 rounded-xl border border-amber-500/20">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          {ghData.totalStars} Stars
        </span>
      </div>

      {ghData.bio && (
        <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          &quot;{ghData.bio}&quot;
        </p>
      )}

      {ghData.topLanguages && ghData.topLanguages.length > 0 && (
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Top Technologies</span>
          <div className="flex flex-wrap gap-2">
            {ghData.topLanguages.map((lang: string) => (
              <span key={lang} className="text-xs font-bold text-orange-300 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/25 flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5" />
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {ghData.repositories && ghData.repositories.length > 0 && (
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Synced Repositories</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ghData.repositories.slice(0, 4).map((repo: GitHubRepo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-800 hover:border-orange-500/40 bg-slate-950/40 hover:bg-slate-950 transition-all block group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-orange-300 truncate">{repo.name}</span>
                  <span className="text-xs text-amber-300 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-300" />
                    {repo.stars}
                  </span>
                </div>
                {repo.description && <p className="text-xs text-slate-400 line-clamp-1">{repo.description}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
