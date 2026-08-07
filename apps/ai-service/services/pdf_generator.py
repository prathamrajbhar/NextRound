import os
import logging
import uuid
from typing import Dict, Any, List
from core.config import settings

logger = logging.getLogger("pdf_generator")

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

    summary = resume_data.get("summary", "Experienced Software Engineer with a track record of delivering scalable systems.")
    contact = resume_data.get("contact", {})
    name = contact.get("name", "Candidate Name")
    email = contact.get("email", "candidate@example.com")
    phone = contact.get("phone", "+1 (555) 019-2834")
    location = contact.get("location", "San Francisco, CA")
    work_history = resume_data.get("work_history", [])
    skills = resume_data.get("skills", ["TypeScript", "React", "Node.js", "Python", "PostgreSQL", "System Architecture"])
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
            story.append(Paragraph(name, name_style))
            contact_info = f"{email} | {phone} | {location}"
            story.append(Paragraph(contact_info, contact_style))
            story.append(Spacer(1, 8))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=8))

            # Summary
            story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
            story.append(Paragraph(summary, body_style))
            story.append(Spacer(1, 6))

            # Work Experience
            if work_history:
                story.append(Paragraph("WORK EXPERIENCE", heading_style))
                for item in work_history:
                    title = item.get("title", "Software Engineer")
                    company = item.get("company", "Tech Co")
                    dates = item.get("dates", "2022 - Present")
                    story.append(Paragraph(f"<b>{title}</b> — <i>{company}</i> ({dates})", body_style))
                    bullets = item.get("bullets", [])
                    for b in bullets:
                        story.append(Paragraph(f"• {b}", bullet_style))
                    story.append(Spacer(1, 4))

            # Skills
            if skills:
                story.append(Paragraph("CORE SKILLS & TECHNOLOGIES", heading_style))
                story.append(Paragraph(", ".join(skills), body_style))
                story.append(Spacer(1, 6))

            # Projects
            if projects:
                story.append(Paragraph("KEY PROJECTS", heading_style))
                for proj in projects:
                    pname = proj.get("name", "Project")
                    pdesc = proj.get("description", "")
                    story.append(Paragraph(f"<b>{pname}</b>: {pdesc}", body_style))

            # Education
            if education:
                story.append(Paragraph("EDUCATION", heading_style))
                for edu in education:
                    deg = edu.get("degree", "B.S. Computer Science")
                    inst = edu.get("institution", "University")
                    story.append(Paragraph(f"<b>{deg}</b> — {inst}", body_style))

            doc.build(story)
            logger.info(f"Resume PDF generated successfully at {file_path}")
            return f"/uploads/resumes/{filename}"
        except Exception as e:
            logger.error(f"Error compiling PDF with ReportLab: {e}")

    # Fallback dummy write
    with open(file_path, "w") as f:
        f.write(f"PDF RESUME MOCK\nName: {name}\nEmail: {email}\nSummary: {summary}\n")
    return f"/uploads/resumes/{filename}"
