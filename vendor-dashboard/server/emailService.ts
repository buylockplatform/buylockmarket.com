import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  vendorEmail: string,
  vendorName: string,
  resetUrl: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"BuyLock Vendor" <${process.env.GMAIL_USER}>`,
      to: vendorEmail,
      subject: "Reset Your BuyLock Vendor Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                  <tr>
                    <td style="background:#FF4605;padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🏪 BuyLock Vendor</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">Password Reset Request</h2>
                      <p style="color:#6b7280;line-height:1.6;margin:0 0 24px;">
                        Hi <strong>${vendorName}</strong>,<br><br>
                        We received a request to reset the password for your BuyLock Vendor account (<strong>${vendorEmail}</strong>).
                        Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
                      </p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${resetUrl}" style="background:#FF4605;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;display:inline-block;">
                          Reset Password
                        </a>
                      </div>
                      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0;">
                        If you didn't request this, you can safely ignore this email — your password won't change.<br><br>
                        Or copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color:#FF4605;word-break:break-all;">${resetUrl}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">
                        © ${new Date().getFullYear()} BuyLock. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
