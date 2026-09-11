import type { ResumeHistoryItem } from './resume.types';

function buildSkillsHtml(skillsList: NonNullable<ResumeHistoryItem['generatedResume']>['skills']): string {
  if (!skillsList || skillsList.length === 0) return '';
  if (typeof skillsList[0] === 'string') {
    return `
      <div class="section-title">Core Competencies & Skills</div>
      <div class="skills-list">
        ${(skillsList as string[]).map((s) => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    `;
  }
  return `
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

function buildExperienceHtml(experienceList: NonNullable<ResumeHistoryItem['generatedResume']>['experience']): string {
  if (!experienceList || experienceList.length === 0) return '';
  return `
    <div class="section-title">Professional Experience</div>
    ${experienceList.map((exp) => {
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

function buildProjectsHtml(projectsList: NonNullable<ResumeHistoryItem['generatedResume']>['projects']): string {
  if (!projectsList || projectsList.length === 0) return '';
  return `
    <div class="section-title">Featured Technical Projects</div>
    ${projectsList.map((proj) => {
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

function buildEducationHtml(educationList: NonNullable<ResumeHistoryItem['generatedResume']>['education']): string {
  if (!educationList || educationList.length === 0) return '';
  return `
    <div class="section-title">Education & Credentials</div>
    ${educationList.map((edu) => {
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

export function printResumeHtml(item: ResumeHistoryItem): void {
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
    contact.portfolio ?? r.portfolio,
  ].filter(Boolean).join(' • ');

  const skillsHtml = buildSkillsHtml(r.skills);
  const experienceHtml = buildExperienceHtml(r.experience);
  const projectsHtml = buildProjectsHtml(r.projects);
  const educationHtml = buildEducationHtml(r.education);
  const certList = r.certifications || [];
  const certsHtml = certList.length > 0
    ? `<div class="section-title">Certifications</div><p style="margin: 0; color: #334155; font-size: 12px;">${certList.join(', ')}</p>`
    : '';

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
      ${r.summary ? `<div class="section-title">Professional Summary</div><p style="margin: 0 0 12px 0; color: #334155;">${r.summary}</p>` : ''}
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
}
