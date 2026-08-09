import os
import logging
import uuid
from typing import Dict, Any, List
from xml.sax.saxutils import escape as xml_escape
from core.config import settings

logger = logging.getLogger("pdf_generator")


def _esc(value: Any) -> str:
    """Escape XML markup characters in dynamic resume text before it reaches
    ReportLab Paragraph (which parses input as mini-XML and would fail on
    unescaped &, <, > from LLM-generated content)."""
    return xml_escape(str(value))

# Try importing reportlab
REPORTLAB_AVAILABLE = False
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    REPORTLAB_AVAILABLE = True
except ImportError:
    logger.warning("ReportLab not installed. Falling back to HTML/text-based PDF export mock.")


def generate_resume_pdf(resume_data: Dict[str, Any], output_dir: str = None) -> str:
    """
    Generates an ATS-friendly single/two-page resume PDF from structured resume JSON.
    Returns local relative upload URL (/uploads/resumes/resume_xxxx.pdf).
    """
    if not output_dir:
        output_dir = os.path.join(settings.upload_dir, "resumes")
    file_id = str(uuid.uuid4())[:8]
    filename = f"resume_{file_id}.pdf"
    file_path = os.path.join(output_dir, filename)

    os.makedirs(output_dir, exist_ok=True)

    summary = resume_data.get("summary", "")
    contact = resume_data.get("contact", {})
    name = contact.get("name", "")
    email = contact.get("email", "")
    phone = contact.get("phone", "")
    location = contact.get("location", "")
    work_history = resume_data.get("work_history", [])
    skills = resume_data.get("skills", [])
    education = resume_data.get("education", [])
    projects = resume_data.get("projects", [])

    if REPORTLAB_AVAILABLE:
        try:
            doc = SimpleDocTemplate(
                file_path,
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )
            styles = getSampleStyleSheet()

            name_style = ParagraphStyle(
                'NameStyle',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=20,
                leading=24,
                textColor=colors.HexColor('#1E293B'),
            )
            contact_style = ParagraphStyle(
                'ContactStyle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=9,
                leading=12,
                textColor=colors.HexColor('#475569'),
            )
            heading_style = ParagraphStyle(
                'HeadingStyle',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=12,
                leading=16,
                textColor=colors.HexColor('#0F172A'),
                spaceBefore=8,
                spaceAfter=4,
            )
            body_style = ParagraphStyle(
                'BodyStyle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=9.5,
                leading=13,
                textColor=colors.HexColor('#334155'),
            )
            bullet_style = ParagraphStyle(
                'BulletStyle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=9,
                leading=12,
                textColor=colors.HexColor('#334155'),
                leftIndent=12,
            )

            story = []

            # Header
            story.append(Paragraph(_esc(name), name_style))
            contact_info = f"{_esc(email)} | {_esc(phone)} | {_esc(location)}"
            story.append(Paragraph(contact_info, contact_style))
            story.append(Spacer(1, 8))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=8))

            # Summary
            story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
            story.append(Paragraph(_esc(summary), body_style))
            story.append(Spacer(1, 6))

            # Work Experience
            if work_history:
                story.append(Paragraph("WORK EXPERIENCE", heading_style))
                for item in work_history:
                    title = item.get("title", "Software Engineer")
                    company = item.get("company", "Tech Co")
                    dates = item.get("dates", "2022 - Present")
                    story.append(Paragraph(f"<b>{_esc(title)}</b> — <i>{_esc(company)}</i> ({_esc(dates)})", body_style))
                    bullets = item.get("bullets", [])
                    for b in bullets:
                        story.append(Paragraph(f"• {_esc(b)}", bullet_style))
                    story.append(Spacer(1, 4))

            # Skills
            if skills:
                story.append(Paragraph("CORE SKILLS &amp; TECHNOLOGIES", heading_style))
                story.append(Paragraph(_esc(", ".join(skills)), body_style))
                story.append(Spacer(1, 6))

            # Projects
            if projects:
                story.append(Paragraph("KEY PROJECTS", heading_style))
                for proj in projects:
                    pname = proj.get("name", "Project")
                    pdesc = proj.get("description", "")
                    story.append(Paragraph(f"<b>{_esc(pname)}</b>: {_esc(pdesc)}", body_style))

            # Education
            if education:
                story.append(Paragraph("EDUCATION", heading_style))
                for edu in education:
                    deg = edu.get("degree", "B.S. Computer Science")
                    inst = edu.get("institution", "University")
                    story.append(Paragraph(f"<b>{_esc(deg)}</b> — {_esc(inst)}", body_style))

            doc.build(story)
            logger.info(f"Resume PDF generated successfully at {file_path}")
            return f"/uploads/resumes/{filename}"
        except Exception as e:
            logger.error(f"Error compiling PDF with ReportLab: {e}")

    raise RuntimeError("ReportLab is required to generate a real resume PDF. No mock PDF is written.")
