import os
import logging
import uuid
from datetime import datetime, timezone
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
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
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


def generate_analytics_pdf(
    metrics: Dict[str, Any],
    conversions: Dict[str, Any],
    narrative: str,
    org_id: str = "",
    output_dir: str = None,
) -> str:
    """
    Generates a real executive analytics report PDF from funnel metrics,
    conversion rates, and the narrative summary. Returns a local relative upload
    URL (/uploads/analytics/analytics_xxxx.pdf). Raises RuntimeError when
    ReportLab is unavailable (no mock PDF is written).
    """
    if not output_dir:
        output_dir = os.path.join(settings.upload_dir, "analytics")
    file_id = str(uuid.uuid4())[:8]
    filename = f"analytics_{file_id}.pdf"
    file_path = os.path.join(output_dir, filename)

    os.makedirs(output_dir, exist_ok=True)

    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab is required to generate a real analytics PDF. No mock PDF is written.")

    try:
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'AnalyticsTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=4,
        )
        meta_style = ParagraphStyle(
            'AnalyticsMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
        )
        heading_style = ParagraphStyle(
            'AnalyticsHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=10,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            'AnalyticsBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#334155'),
        )

        generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        org_label = org_id if org_id and str(org_id).strip() else "All organizations"

        story = []
        story.append(Paragraph("Hiring Analytics — Executive Report", title_style))
        story.append(Paragraph(f"Organization: {_esc(org_label)}", meta_style))
        story.append(Paragraph(f"Generated: {generated}", meta_style))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=0, spaceAfter=8))

        # Funnel table
        funnel_rows = [["Stage", "Candidates", "Conversion"]]
        stages = [
            ("Applied", metrics.get("applied", 0), None),
            ("Screened", metrics.get("screened", 0), conversions.get("appliedToScreened")),
            ("Interviewed", metrics.get("interviewed", 0), conversions.get("screenedToInterviewed")),
            ("Offered", metrics.get("offered", 0), conversions.get("interviewedToOffered")),
            ("Accepted", metrics.get("accepted", 0), conversions.get("offerAcceptanceRate")),
        ]
        for label, count, conv in stages:
            conv_text = f"{conv}%" if isinstance(conv, (int, float)) else "—"
            funnel_rows.append([label, str(count), conv_text])

        table = Table(funnel_rows, colWidths=[130, 90, 90], repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEADING', (0, 0), (-1, -1), 12),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(Paragraph("RECRUITMENT FUNNEL", heading_style))
        story.append(table)

        # Time to hire (reported only when a real terminal timestamp exists)
        time_to_hire = metrics.get("time_to_hire_days")
        if isinstance(time_to_hire, (int, float)) and not isinstance(time_to_hire, bool):
            story.append(Paragraph(f"Average time to hire: {round(time_to_hire)} days", body_style))
        else:
            story.append(Paragraph("Average time to hire: not available (no terminal offer/acceptance timestamps recorded)", body_style))

        # Narrative
        story.append(Paragraph("EXECUTIVE SUMMARY", heading_style))
        if narrative and narrative.strip():
            story.append(Paragraph(_esc(narrative), body_style))
        else:
            story.append(Paragraph("No narrative summary was available for this reporting period.", body_style))

        doc.build(story)
        logger.info(f"Analytics PDF generated successfully at {file_path}")
        return f"/uploads/analytics/{filename}"
    except Exception as e:
        logger.error(f"Error compiling analytics PDF with ReportLab: {e}")

    raise RuntimeError("ReportLab is required to generate a real analytics PDF. No mock PDF is written.")
