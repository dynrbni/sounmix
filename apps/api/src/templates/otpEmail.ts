type OtpEmailInput = {
  otp: string
  expiresMinutes: number
  appUrl: string
}

export function renderOtpEmail({ otp, expiresMinutes, appUrl }: OtpEmailInput) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Sounmix verification code</title>
  </head>
  <body style="margin:0;background:#f8f7fb;font-family:Inter,Arial,sans-serif;color:#14121f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:radial-gradient(circle at 20% 10%,#ddd6fe 0,#f8f7fb 32%,#eff6ff 100%);padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:rgba(255,255,255,0.92);border:1px solid rgba(255,255,255,0.9);border-radius:32px;overflow:hidden;box-shadow:0 24px 80px rgba(76,29,149,0.14);">
            <tr>
              <td style="background:#14121f;padding:34px;color:#ffffff;">
                <div style="display:inline-block;background:#ffffff;color:#14121f;border-radius:18px;padding:10px 14px;font-weight:900;letter-spacing:-0.02em;">Sounmix</div>
                <h1 style="margin:28px 0 0;font-size:34px;line-height:1.05;letter-spacing:-0.04em;">Verify your sign in</h1>
                <p style="margin:14px 0 0;color:rgba(255,255,255,0.68);font-size:16px;line-height:1.7;">Use this one-time code to continue securely into your music dashboard.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:34px;">
                <p style="margin:0 0 12px;color:#7c3aed;font-weight:900;text-transform:uppercase;font-size:12px;letter-spacing:0.12em;">Your OTP code</p>
                <div style="background:#ede9fe;border:1px solid #ddd6fe;border-radius:24px;padding:24px;text-align:center;">
                  <div style="font-size:42px;line-height:1;font-weight:900;letter-spacing:0.18em;color:#14121f;">${otp}</div>
                </div>
                <p style="margin:22px 0 0;color:rgba(20,18,31,0.64);font-size:15px;line-height:1.7;">This code expires in <strong>${expiresMinutes} minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
                <a href="${appUrl}" style="display:inline-block;margin-top:28px;background:#14121f;color:#ffffff;text-decoration:none;border-radius:999px;padding:15px 22px;font-weight:900;">Open Sounmix</a>
                <div style="margin-top:30px;background:#f8f7fb;border-radius:22px;padding:18px;color:rgba(20,18,31,0.62);font-size:14px;line-height:1.7;">
                  Security note: Sounmix will never ask for your provider access tokens by email.
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:22px 0 0;color:rgba(20,18,31,0.45);font-size:12px;">Sounmix · Move, clean, and organize your music.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
