'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Sparkles,
  Search,
  Plus,
  Star,
  Trash2,
  Edit,
} from '@/lib/lucide-google-icons';
import { apiClient } from '@/lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { useResumeHistory } from '@/hooks/queries';
import { EditResumeModal, GeneratedResumeData } from './_components/EditResumeModal';
import { Modal, ResumesListSkeleton } from '@/components/ui';

interface ResumeHistoryItem {
  id: string;
  targetRole: string;
  targetCompany: string;
  status: string;
  generatedResume: GeneratedResumeData | null;
  resumePdfUrl: string | null;
  createdAt: string;
  endedAt: string | null;
}

export default function CandidateResumesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ResumeHistoryItem | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading } = useResumeHistory();

  const history = useMemo(
    () => ((data?.history ?? []) as ResumeHistoryItem[]),
    [data]
  );

  useEffect(() => {
    if (history.length > 0 && primaryId === null) {
      setPrimaryId(history[0].id);
    }
  }, [history, primaryId]);

  const handleDownloadPdf = (item: ResumeHistoryItem) => {
    if (item.resumePdfUrl) {
      window.open(item.resumePdfUrl, '_blank');
      return;
    }

    const r = item.generatedResume || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;


    const contact = r.contact || {};
    const contactInfo = [
      contact.phone ?? r.phone,
      contact.email ?? r.email,
      contact.location ?? r.location,
      contact.linkedin ?? r.linkedin,
      contact.github ?? r.github,
      contact.portfolio ?? r.portfolio
    ].filter(Boolean).join(' • ');


    let skillsHtml = '';
    const skillsList = r.skills || [];
    if (skillsList.length > 0) {
      if (typeof skillsList[0] === 'string') {
        skillsHtml = `
          <div class="section-title">Core Competencies & Skills</div>
          <div class="skills-list">
            ${skillsList.map((s: string) => `<span class="skill-tag">${s}</span>`).join('')}
          </div>
        `;
      } else {
        skillsHtml = `
          <div class="section-title">Core Competencies & Skills</div>
          <div style="font-size: 12px; line-height: 1.6; margin-bottom: 12px;">
            ${(skillsList as Array<{ category?: string; items?: string[] }>).map((group) => `
              <div style="margin-bottom: 6px;">
                <strong style="font-weight: 700; color: #0f172a;">${group.category || 'Skills'}:</strong>
                <span style="color: #334155;">${(group.items || []).join(', ')}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }


    const experienceList = r.experience || [];
    let experienceHtml = '';
    if (experienceList.length > 0) {
      experienceHtml = `
        <div class="section-title">Professional Experience</div>
        ${(experienceList as Array<{ role?: string; title?: string; company?: string; period?: string; duration?: string; location?: string; highlights?: string[]; bullets?: string[] }>).map((exp) => {
          const roleTitle = exp.role || exp.title || '';
          const duration = exp.period || exp.duration || '';
          const loc = exp.location ? ` | ${exp.location}` : '';
          const highlights = exp.highlights || exp.bullets || [];
          return `
            <div style="margin-bottom: 14px;">
              <div class="job-header">
                <span>${roleTitle} <span style="font-weight: 600; color: #475569;">— ${exp.company || ''}</span></span>
                <span class="job-period">${duration}${loc}</span>
              </div>
              <ul>
                ${highlights.map((h: string) => `<li>${h}</li>`).join('')}
              </ul>
            </div>
          `;
        }).join('')}
      `;
    }


    const projectsList = r.projects || [];
    let projectsHtml = '';
    if (projectsList.length > 0) {
      projectsHtml = `
        <div class="section-title">Featured Technical Projects</div>
        ${(projectsList as Array<{ title?: string; name?: string; techStack?: string[]; tech_stack?: string[]; description?: string; impact?: string }>).map((proj) => {
          const title = proj.title || proj.name || '';
          const tech = proj.techStack || proj.tech_stack || [];
          const techStr = tech.length > 0 ? ` [${tech.join(', ')}]` : '';
          const desc = proj.description || '';
          const impact = proj.impact || '';
          return `
            <div style="margin-bottom: 14px;">
              <div class="job-header">
                <span>${title}<span style="font-weight: 500; font-size: 11px; color: #64748b;">${techStr}</span></span>
              </div>
              <p style="margin: 4px 0; color: #334155;">${desc}</p>
              ${impact ? `<p style="margin: 0; color: #ea580c; font-size: 11px; font-weight: 600;">Impact: ${impact}</p>` : ''}
            </div>
          `;
        }).join('')}
      `;
    }


    const educationList = r.education || [];
    let educationHtml = '';
    if (educationList.length > 0) {
      educationHtml = `
        <div class="section-title">Education & Credentials</div>
        ${(educationList as Array<{ degree?: string; institution?: string; year?: string; dates?: string; gpa?: string }>).map((edu) => {
          const degree = edu.degree || '';
          const institution = edu.institution || '';
          const year = edu.year || edu.dates || '';
          const gpa = edu.gpa ? ` (GPA: ${edu.gpa})` : '';
          return `
            <div class="job-header" style="margin-bottom: 6px;">
              <span><strong style="font-weight: 700;">${degree}</strong> — ${institution}</span>
              <span class="job-period">${year}${gpa}</span>
            </div>
          `;
        }).join('')}
      `;
    }


    const certList = r.certifications || [];
    let certsHtml = '';
    if (certList.length > 0) {
      certsHtml = `
        <div class="section-title">Certifications</div>
        <p style="margin: 0; color: #334155; font-size: 12px;">${certList.join(', ')}</p>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${r.name || 'Resume'} - ATS Export</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          h1 { font-size: 22px; margin: 0 0 4px 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 12px; color: #475569; margin-bottom: 16px; font-weight: 600; }
          .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin: 18px 0 10px 0; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
          .skill-tag { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #334155; }
          ul { margin: 6px 0 12px 18px; padding: 0; }
          li { margin-bottom: 4px; }
          .job-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; color: #0f172a; }
          .job-period { font-weight: 500; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${(contact.name ?? r.name) || 'Candidate Name'}</h1>
        <div class="subtitle">${contactInfo}</div>

        ${r.summary ? `
          <div class="section-title">Professional Summary</div>
          <p style="margin: 0 0 12px 0; color: #334155;">${r.summary}</p>
        ` : ''}

        ${skillsHtml}

        ${experienceHtml}

        ${projectsHtml}

        ${educationHtml}

        ${certsHtml}

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSaveEditedResume = (updatedItem: { id: string; targetRole: string; targetCompany: string; generatedResume: GeneratedResumeData | null }) => {
    const updated = history.map(h => h.id === updatedItem.id ? { ...h, ...updatedItem } : h);
    queryClient.setQueryData(['resume-history'], { history: updated });
  };

  const handleDeleteResume = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const performDelete = async (id: string) => {
    try {
      await apiClient.delete(`/resume-builder/${id}`);
      const remaining = history.filter(h => h.id !== id);
      queryClient.setQueryData(['resume-history'], { history: remaining });
      if (primaryId === id) {
        setPrimaryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const filteredHistory = history.filter(item =>
    item.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.targetCompany && item.targetCompany.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">

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

      {isLoading ? (
        <ResumesListSkeleton count={6} />
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
                      {typeof item.generatedResume?.atsScore === 'number'
                        ? `ATS ${Math.round(item.generatedResume.atsScore)}%`
                        : 'ATS'}
                    </span>
                  </div>

                  {hasSummary && item.generatedResume && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-white/50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 font-medium">
                      {item.generatedResume.summary}
                    </p>
                  )}

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

      <EditResumeModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        resumeItem={editingItem}
        onSave={handleSaveEditedResume}
      />

      <Modal
        isOpen={Boolean(deleteConfirmationId)}
        onClose={() => setDeleteConfirmationId(null)}
        title="Delete Resume"
        description="This action cannot be undone. Are you sure you want to permanently delete this resume?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setDeleteConfirmationId(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (deleteConfirmationId) {
                  await performDelete(deleteConfirmationId);
                  setDeleteConfirmationId(null);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-sm"
            >
              Delete Permanently
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Deleting this resume will permanently remove it from your resume vault. You will lose all ATS scoring details and the PDF download copy.
        </p>
      </Modal>

    </div>
  );
}
