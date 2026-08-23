import nodemailer from "nodemailer";
import { stateService } from "./state.service";

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  recipient: string;
  isSimulated?: boolean;
  error?: string;
}

export class MailerService {
  private formatHtmlEmail(markdownSummary: string, recipient: string): string {
    // Simple markdown formatting for HTML emails
    const formattedBody = markdownSummary
      .replace(/^### (.*$)/gim, '<h3 style="color: #F5F5DC; font-size: 16px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #333333; padding-bottom: 4px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #F5F5DC; font-size: 18px; margin-top: 24px; margin-bottom: 12px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #F5F5DC; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-style: italic;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #FFFFFF;">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" style="color: #F5F5DC; text-decoration: underline;">$1</a>')
      .replace(/\n\n/gim, '</p><p style="margin: 10px 0; line-height: 1.7; color: #CCCCCC;">')
      .replace(/\n/gim, '<br />');

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanto Automator Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #F5F5DC;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; border: 1px solid #333333; border-radius: 8px; background-color: #0a0a0a; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px; border-bottom: 1px solid #333333; background-color: #000000;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="right">
                    <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 20px; color: #F5F5DC; letter-spacing: 0.5px;">Kanto <span style="color: #888888;">Automator</span></span>
                  </td>
                  <td align="left">
                    <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #888888; border: 1px solid #333333; padding: 4px 8px; border-radius: 4px;">DAILY BRIEF</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 30px 24px; font-size: 14px; line-height: 1.8; text-align: right; direction: rtl;">
              <p style="margin-top: 0;">${formattedBody}</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #333333; background-color: #000000; text-align: center;">
              <span style="font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 2px;">
                KANTO EMPIRE · AUTOMATED SYSTEM · ${recipient}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async sendSummaryEmail(
    summaryText: string,
    recipientEmail?: string
  ): Promise<SendMailResult> {
    const settings = stateService.getSettings();
    const recipient = recipientEmail || settings.recipientEmail || "commander@kanto.empire";
    const smtp = settings.smtpConfig;

    stateService.appendLog(
      "email",
      "info",
      `Initiating email delivery to ${recipient}...`
    );

    // Check if real SMTP credentials are provided
    if (!smtp.host || !smtp.user) {
      stateService.appendLog(
        "email",
        "warn",
        "SMTP credentials not fully configured. Creating local simulated delivery..."
      );

      const htmlContent = this.formatHtmlEmail(summaryText, recipient);

      stateService.appendLog(
        "email",
        "info",
        `[SIMULATED EMAIL DISPATCH] To: ${recipient} | Length: ${htmlContent.length} bytes`
      );

      return {
        success: true,
        recipient,
        messageId: "simulated_" + Date.now(),
        isSimulated: true,
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      const html = this.formatHtmlEmail(summaryText, recipient);

      const info = await transporter.sendMail({
        from: smtp.from || `"Kanto Automator" <${smtp.user}>`,
        to: recipient,
        subject: `⚡ موجز Kanto الذكي - ${new Date().toLocaleDateString("ar-SA")}`,
        text: summaryText,
        html,
      });

      stateService.appendLog(
        "email",
        "info",
        `Email successfully delivered. Message ID: ${info.messageId}`
      );

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

      return {
        success: true,
        messageId: info.messageId,
        recipient,
        previewUrl,
        isSimulated: false,
      };
    } catch (err: any) {
      stateService.appendLog(
        "email",
        "error",
        `Failed to send email: ${err?.message || "SMTP error"}`
      );
      throw new Error(`Email delivery failed: ${err?.message}`);
    }
  }
}

export const mailerService = new MailerService();
