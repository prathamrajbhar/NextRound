export interface EmailLayoutProps {
  preheader?: string;
  title: string;
  contentHtml: string;
  actionButton?: {
    text: string;
    url: string;
  };
  secondaryText?: string;
  footerNotice?: string;
}

export function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderProfessionalEmailLayout(props: EmailLayoutProps): string {
  const { preheader, title, contentHtml, actionButton, secondaryText, footerNotice } = props;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  ${preheader ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .container-table {
        width: 100% !important;
        padding: 16px !important;
      }
      .card-content {
        padding: 24px 18px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container-table" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;margin:0 auto;">
          <!-- Brand Header -->
          <tr>
            <td style="padding:0 0 20px 0;text-align:left;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#0f172a;width:28px;height:28px;border-radius:6px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:14px;font-weight:700;line-height:28px;">N</span>
                  </td>
                  <td style="padding-left:10px;font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">
                    NextRound
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td class="card-content" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              <h1 style="margin:0 0 20px 0;font-size:20px;font-weight:600;color:#0f172a;line-height:1.4;">
                ${escapeHtml(title)}
              </h1>
              
              <div style="font-size:15px;line-height:1.6;color:#334155;">
                ${contentHtml}
              </div>

              ${actionButton ? `
              <div style="margin:32px 0 24px 0;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color:#0f172a;border-radius:6px;">
                      <a href="${actionButton.url}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">
                        ${escapeHtml(actionButton.text)} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              ` : ''}

              ${secondaryText ? `
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;line-height:1.5;">
                ${secondaryText}
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px;text-align:left;font-size:12px;color:#94a3b8;line-height:1.5;">
              <p style="margin:0 0 6px 0;">
                ${footerNotice || 'This is an automated notification from NextRound. Please do not reply directly to this email.'}
              </p>
              <p style="margin:0;">
                &copy; ${new Date().getFullYear()} NextRound Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
