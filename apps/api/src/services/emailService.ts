import nodemailer from 'nodemailer'
import { config } from '../config/env.js'
import { renderOtpEmail } from '../templates/otpEmail.js'

export async function sendOtpEmail(email: string, otp: string) {
  const hasSmtpConfig = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass)
  const htmlContent = renderOtpEmail({ otp, expiresMinutes: config.otp.expiresMinutes, appUrl: config.appUrl })
  const textContent = `Your Sounmix verification code is ${otp}. This code expires in ${config.otp.expiresMinutes} minutes.`

  console.log(`\n==================================================`)
  console.log(`[SOUNMIX OTP SERVICE] Request to send OTP code`)
  console.log(`Recipient Email : ${email}`)
  console.log(`Verification OTP: ${otp}`)
  console.log(`Expires in      : ${config.otp.expiresMinutes} minutes`)
  console.log(`==================================================\n`)

  if (hasSmtpConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      })

      await transporter.verify()

      const info = await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Your Sounmix verification code',
        html: htmlContent,
        text: textContent,
      })

      console.log(`[SOUNMIX OTP SERVICE] Email successfully sent via SMTP to ${email}. MessageId: ${info.messageId}`)
      return { success: true, mode: 'smtp', messageId: info.messageId }
    } catch (smtpError) {
      console.warn(`[SOUNMIX OTP SERVICE] SMTP send failed: ${(smtpError as Error).message}. Falling back to dev logger/ethereal.`)
    }
  }

  // Fallback for development / unconfigured SMTP: Try Ethereal or log code
  try {
    const testAccount = await nodemailer.createTestAccount()
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    const info = await testTransporter.sendMail({
      from: config.smtp.from || 'Sounmix <no-reply@sounmix.app>',
      to: email,
      subject: 'Your Sounmix verification code (Development)',
      html: htmlContent,
      text: textContent,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`[SOUNMIX OTP SERVICE] Dev Ethereal Email Preview URL: ${previewUrl}`)
    }

    return {
      success: true,
      mode: 'ethereal',
      previewUrl: previewUrl || undefined,
      otp,
    }
  } catch (fallbackError) {
    console.log(`[SOUNMIX OTP SERVICE] Dev mode fallback active for ${email}. OTP is ${otp}`)
    return {
      success: true,
      mode: 'console',
      otp,
    }
  }
}

