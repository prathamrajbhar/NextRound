import logging
from typing import Any
from xml.sax.saxutils import escape as xml_escape
import boto3
from botocore.config import Config
from core.config import settings

logger = logging.getLogger("pdf_s3")

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.aws_endpoint_url,
        region_name=settings.aws_default_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        config=Config(s3={"addressing_style": "path"}),
    )

def upload_to_s3(file_path: str, key: str, content_type: str = "application/pdf") -> str:
    s3 = get_s3_client()
    normalized_key = key.lstrip("/")

    with open(file_path, "rb") as f:
        s3.put_object(
            Bucket=settings.aws_s3_bucket,
            Key=normalized_key,
            Body=f,
            ContentType=content_type,
        )

    clean_endpoint = settings.aws_endpoint_url.rstrip("/")
    return f"{clean_endpoint}/{settings.aws_s3_bucket}/{normalized_key}"

def _esc(value: Any) -> str:
    return xml_escape(str(value))

REPORTLAB_AVAILABLE = False
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    REPORTLAB_AVAILABLE = True
except ImportError:
    logger.warning("ReportLab not installed. PDF generation will fail with an explicit error — no mock PDF is produced.")
