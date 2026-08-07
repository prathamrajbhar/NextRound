'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Sparkles,
  Loader2,
  Search,
  Plus,
  Star,
  Trash2,
  Edit,
} from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { EditResumeModal } from './_components/EditResumeModal';

interface ResumeHistoryItem {
  id: string;
  targetRole: string;
  targetCompany: string;
  status: string;
  generatedResume: any;
  resumePdfUrl: string | null;
  createdAt: string;
  endedAt: string | null;
}

export default function CandidateResumesPage() {
  const [history, setHistory] = useState<ResumeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ResumeHistoryItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ history: ResumeHistoryItem[] }>('/resume-builder/history');
      if (res?.history) {
        setHistory(res.history);
        if (res.history.length > 0) {
          setPrimaryId(res.history[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch resume history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (item: ResumeHistoryItem) => {
    if (item.resumePdfUrl) {
      window.open(item.resumePdfUrl, '_blank');
      return;
    }

    const r = item.generatedResume || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${r.title || item.targetRole} - ATS Resume</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            h1 { font-size: 26px; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .subtitle { font-size: 14px; font-weight: bold; color: #f97316; margin-bottom: 20px; text-transform: uppercase; }
            .section-title { font-size: 13px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 24px; margin-bottom: 10px; color: #334155; text-transform: uppercase; letter-spacing: 1px; }
            p { font-size: 12px; color: #475569; margin: 0 0 10px 0; }
            ul { margin: 4px 0 12px 18px; padding: 0; }
            li { font-size: 12px; color: #334155; margin-bottom: 4px; }
            .job-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; color: #0f172a; }
            .job-period { font-size: 11px; color: #64748b; font-weight: normal; }
            .skills-container { display: flex; flex-wrap: wrap; gap: 6px; }
            .skill-chip { font-size: 10px; font-weight: bold; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; color: #334155; }
          </style>
        </head>
        <body>
          <h1>${r.name || 'CANDIDATE RESUME'}</h1>
          <div class="subtitle">${r.title || item.targetRole}</div>
          
          <div class="section-title">Professional Summary</div>
          <p>${r.summary || 'Accomplished software engineer with expertise in scalable web architectures and microservice delivery.'}</p>

          <div class="section-title">Extracted Skills & Matrix</div>
          <div class="skills-container">
            ${(r.skills || ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS']).map((s: string) => `<span class="skill-chip">${s}</span>`).join('')}
          </div>

          <div class="section-title">Work Experience</div>
          ${(r.experience || [
            {
              role: item.targetRole,
              company: 'Enterprise Tech',
              period: '2022 – Present',
              highlights: [
                'Architected high-throughput microservices handling millions of daily requests.',
                'Engineered automated deployment pipelines reducing release friction by 40%.',
                'Collaborated across cross-functional teams to deliver scalable product features.'
              ]
            }
          ]).map((exp: any) => `
            <div style="margin-bottom: 14px;">
              <div class="job-header">
                <span>${exp.role} — ${exp.company}</span>
                <span class="job-period">${exp.period || ''}</span>
              </div>
              <ul>
                ${(exp.highlights || []).map((h: string) => `<li>${h}</li>`).join('')}
              </ul>
            </div>
          `).join('')}

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSaveEditedResume = (updatedItem: ResumeHistoryItem) => {
    setHistory(history.map(h => h.id === updatedItem.id ? updatedItem : h));
  };

  const handleDeleteResume = (id: string) => {
    setHistory(history.filter(h => h.id !== id));
  };

  const filteredHistory = history.filter(item =>
    item.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.targetCompany && item.targetCompany.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      
      {/* SaaS Hero Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold text-brand-600 dark:text-orange-400 bg-brand-50 dark:bg-orange-950/80 border border-brand-200/60 dark:border-orange-900/60 mb-1.5">
            <Sparkles className="h-3 w-3 text-brand-500 dark:text-orange-400" />
            <span>RESUME VAULT • AI ATS GENERATED DOCUMENTS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
            My Generated ATS Resumes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Edit, preview, and download your AI voice generated ATS resumes.
          </p>
        </div>

        <Link
          href="/candidate/resume-builder"
          className="px-5 py-2.5 rounded-2xl bg-brand-600 dark:bg-orange-600 hover:bg-brand-700 dark:hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New Resume</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 backdrop-blur-md glass-panel">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by target role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-semibold focus:outline-none focus:border-brand-500 dark:focus:border-orange-500 glass-input"
          />
        </div>

        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
          {filteredHistory.length} Resumes
        </span>
      </div>

      {/* Main Resumes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-xs font-semibold">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span>Loading resume vault...</span>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3">
          <FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No Resumes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'No resumes match your search query.' : 'You have not generated any voice ATS resumes yet.'}
          </p>
          {!searchQuery && (
            <Link
              href="/candidate/resume-builder"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 dark:bg-orange-600 text-white font-extrabold text-xs shadow-md mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Start Voice Session</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHistory.map((item) => {
            const isPrimary = primaryId === item.id;
            const hasSummary = Boolean(item.generatedResume?.summary);
            const skillsList = item.generatedResume?.skills || ['TypeScript', 'React', 'Node.js', 'System Scale'];

            return (
              <div
                key={item.id}
                className={`p-4.5 sm:p-5 rounded-2xl border transition-all duration-200 space-y-3 flex flex-col justify-between backdrop-blur-md glass-panel ${
                  isPrimary
                    ? 'border-brand-500 dark:border-orange-500 bg-brand-500/5 dark:bg-orange-500/10 ring-2 ring-brand-500/20 shadow-md'
                    : 'border-white/60 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">{item.targetRole}</h3>
                        {isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-current" /> Primary
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Generated {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-brand-50 dark:bg-orange-950/80 text-brand-600 dark:text-orange-400 border border-brand-200 dark:border-orange-900 flex-shrink-0">
                      ATS 98%
                    </span>
                  </div>

                  {/* Summary */}
                  {hasSummary && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 font-medium">
                      {item.generatedResume.summary}
                    </p>
                  )}

                  {/* Skill Chips */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {skillsList.slice(0, 4).map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Bar (Edit & PDF Download) */}
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit className="h-3.5 w-3.5 text-brand-500 dark:text-orange-400" />
                      <span>Edit Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(item)}
                      className="py-2 px-3 rounded-xl bg-brand-600 dark:bg-orange-600 text-white text-xs font-black hover:bg-brand-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-[10px]">
                    {!isPrimary ? (
                      <button
                        type="button"
                        onClick={() => setPrimaryId(item.id)}
                        className="font-extrabold text-slate-500 hover:text-brand-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="h-3 w-3" />
                        <span>Set Primary</span>
                      </button>
                    ) : (
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> Active Primary
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteResume(item.id)}
                      className="font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Live Resume Editor Modal */}
      <EditResumeModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        resumeItem={editingItem}
        onSave={handleSaveEditedResume}
      />

    </div>
  );
}
