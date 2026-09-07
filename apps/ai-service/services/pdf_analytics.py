import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from services.pdf_s3 import upload_to_s3, _esc, REPORTLAB_AVAILABLE

logger = logging.getLogger("pdf_analytics")

def generate_analytics_pdf(
    metrics: Dict[str, Any],
    conversions: Dict[str, Any],
    narrative: str,
    org_id: str = "",
) -> str:
    file_id = str(uuid.uuid4())[:8]
    filename = f"analytics_{file_id}.pdf"

    temp_dir = "/tmp/nextround-analytics"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, filename)

    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab is required to generate a real analytics PDF. No mock PDF is written.")

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

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

        time_to_hire = metrics.get("time_to_hire_days")
        if isinstance(time_to_hire, (int, float)) and not isinstance(time_to_hire, bool):
            story.append(Paragraph(f"Average time to hire: {round(time_to_hire)} days", body_style))
        else:
            story.append(Paragraph("Average time to hire: not available (no terminal offer/acceptance timestamps recorded)", body_style))

        story.append(Paragraph("EXECUTIVE SUMMARY", heading_style))
        if narrative and narrative.strip():
            story.append(Paragraph(_esc(narrative), body_style))
        else:
            story.append(Paragraph("No narrative summary was available for this reporting period.", body_style))

        doc.build(story)
        logger.info(f"Analytics PDF generated successfully at {file_path}")

        key = f"analytics/{filename}"
        try:
            public_url = upload_to_s3(file_path, key, "application/pdf")
            return public_url
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        logger.error(f"Error compiling analytics PDF with ReportLab: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e
