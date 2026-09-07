import os
import logging
import uuid
from typing import Dict, Any
from services.pdf.pdf_s3 import upload_to_s3, _esc, REPORTLAB_AVAILABLE

logger = logging.getLogger("pdf_resume")

def generate_resume_pdf(resume_data: Dict[str, Any]) -> str:
    file_id = str(uuid.uuid4())[:8]
    filename = f"resume_{file_id}.pdf"

    temp_dir = "/tmp/nextround-resumes"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, filename)

    summary = resume_data.get("summary", "")
    contact = resume_data.get("contact", {})
    name = contact.get("name", "")
    email = contact.get("email", "")
    phone = contact.get("phone", "")
    location = contact.get("location", "")
    linkedin = contact.get("linkedin", "") or contact.get("linkedIn", "")
    github = contact.get("github", "") or contact.get("gitHub", "")
    portfolio = contact.get("portfolio", "")

    work_history = resume_data.get("work_history", []) or resume_data.get("experience", [])
    skills = resume_data.get("skills", [])
    education = resume_data.get("education", [])
    projects = resume_data.get("projects", [])

    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab is required to generate a real resume PDF. No mock PDF is written.")

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

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
            'NameStyle', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=20, leading=24,
            textColor=colors.HexColor('#0F172A'),
        )
        contact_style = ParagraphStyle(
            'ContactStyle', parent=styles['Normal'],
            fontName='Helvetica', fontSize=9, leading=12,
            textColor=colors.HexColor('#475569'),
        )
        heading_style = ParagraphStyle(
            'HeadingStyle', parent=styles['Normal'],
            fontName='Helvetica-Bold', fontSize=11, leading=15,
            textColor=colors.HexColor('#0F172A'),
            spaceBefore=10, spaceAfter=2,
        )
        body_style = ParagraphStyle(
            'BodyStyle', parent=styles['Normal'],
            fontName='Helvetica', fontSize=9.5, leading=13,
            textColor=colors.HexColor('#1E293B'),
        )
        bullet_style = ParagraphStyle(
            'BulletStyle', parent=styles['Normal'],
            fontName='Helvetica', fontSize=9, leading=12,
            textColor=colors.HexColor('#334155'), leftIndent=12,
        )

        story = []
        story.append(Paragraph(_esc(name), name_style))

        contact_parts = []
        if email: contact_parts.append(email)
        if phone: contact_parts.append(phone)
        if location: contact_parts.append(location)
        if linkedin: contact_parts.append(linkedin)
        if github: contact_parts.append(github)
        if portfolio: contact_parts.append(portfolio)

        contact_info = " | ".join(contact_parts)
        story.append(Paragraph(_esc(contact_info), contact_style))
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#94A3B8'), spaceBefore=0, spaceAfter=6))

        if summary:
            story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=1, spaceAfter=4))
            story.append(Paragraph(_esc(summary), body_style))
            story.append(Spacer(1, 4))

        if work_history:
            story.append(Paragraph("WORK EXPERIENCE", heading_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=1, spaceAfter=4))
            for item in work_history:
                title = item.get("title", "") or item.get("role", "")
                company = item.get("company", "")
                dates = item.get("dates", "") or item.get("period", "")
                loc = item.get("location", "")

                header_text = f"<b>{_esc(title)}</b> — <i>{_esc(company)}</i>"
                if dates:
                    header_text += f" ({_esc(dates)})"
                if loc:
                    header_text += f" | {_esc(loc)}"

                story.append(Paragraph(header_text, body_style))
                bullets = item.get("bullets", []) or item.get("highlights", [])
                for b in bullets:
                    story.append(Paragraph(f"• {_esc(b)}", bullet_style))
                story.append(Spacer(1, 4))

        if skills:
            story.append(Paragraph("CORE SKILLS &amp; TECHNOLOGIES", heading_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=1, spaceAfter=4))
            skills_list = []
            if isinstance(skills, list):
                for sk in skills:
                    if isinstance(sk, dict):
                        category = sk.get("category", "")
                        items = sk.get("items", [])
                        if items:
                            skills_list.append(f"<b>{_esc(category)}</b>: {_esc(', '.join(items))}")
                    else:
                        skills_list.append(str(sk))
                skills_text = " | ".join(skills_list) if isinstance(skills[0], dict) else ", ".join(skills_list)
            else:
                skills_text = str(skills)
            story.append(Paragraph(skills_text, body_style))
            story.append(Spacer(1, 4))

        if projects:
            story.append(Paragraph("KEY PROJECTS", heading_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=1, spaceAfter=4))
            for proj in projects:
                pname = proj.get("name", "") or proj.get("title", "")
                pdesc = proj.get("description", "") or proj.get("impact", "")
                ptech = proj.get("techStack", []) or proj.get("tech_stack", [])

                proj_text = f"<b>{_esc(pname)}</b>"
                if ptech:
                    proj_text += f" (<i>{_esc(', '.join(ptech))}</i>)"
                story.append(Paragraph(proj_text, body_style))
                story.append(Paragraph(f"{_esc(pdesc)}", bullet_style))
                story.append(Spacer(1, 4))

        if education:
            story.append(Paragraph("EDUCATION", heading_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=1, spaceAfter=4))
            for edu in education:
                deg = edu.get("degree", "")
                inst = edu.get("institution", "")
                year = edu.get("year", "") or edu.get("dates", "")
                gpa = edu.get("gpa", "")

                edu_text = f"<b>{_esc(deg)}</b> — {_esc(inst)}"
                if year:
                    edu_text += f" ({_esc(year)})"
                if gpa:
                    edu_text += f" | GPA: {_esc(gpa)}"
                story.append(Paragraph(edu_text, body_style))
                story.append(Spacer(1, 4))

        doc.build(story)
        logger.info(f"Resume PDF generated successfully at {file_path}")

        key = f"resumes/{filename}"
        try:
            public_url = upload_to_s3(file_path, key, "application/pdf")
            return public_url
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        logger.error(f"Error compiling PDF with ReportLab: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e
