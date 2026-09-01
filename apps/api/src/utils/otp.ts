import crypto from 'node:crypto'

export function createOtp() {
  return crypto.randomInt(100000, 999999).toString()
}

export function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export function safeCompareHash(input: string, expected: string) {
  const left = Buffer.from(hashOtp(input))
  const right = Buffer.from(expected)

  return left.length === right.length && crypto.timingSafeEqual(left, right)
}
