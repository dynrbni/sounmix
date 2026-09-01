import { createOtp, hashOtp, safeCompareHash } from '../utils/otp.js'

type OtpRecord = {
  email: string
  otpHash: string
  expiresAt: number
  attempts: number
}

const otpStore = new Map<string, OtpRecord>()

export function createOtpChallenge(email: string, expiresMinutes: number) {
  const otp = createOtp()
  const normalizedEmail = email.toLowerCase().trim()

  otpStore.set(normalizedEmail, {
    email: normalizedEmail,
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + expiresMinutes * 60 * 1000,
    attempts: 0,
  })

  return otp
}

export function verifyOtpChallenge(email: string, otp: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const record = otpStore.get(normalizedEmail)

  if (!record) {
    return { ok: false, code: 'OTP_NOT_FOUND' }
  }

  if (record.expiresAt < Date.now()) {
    otpStore.delete(normalizedEmail)
    return { ok: false, code: 'OTP_EXPIRED' }
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail)
    return { ok: false, code: 'OTP_TOO_MANY_ATTEMPTS' }
  }

  record.attempts += 1

  if (!safeCompareHash(otp, record.otpHash)) {
    return { ok: false, code: 'OTP_INVALID' }
  }

  otpStore.delete(normalizedEmail)
  return { ok: true, code: 'OTP_VERIFIED' }
}
