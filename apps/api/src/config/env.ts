import 'dotenv/config'

function getEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback
}

export const config = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', '4000')),
  appUrl: getEnv('APP_URL', 'http://localhost:5173'),
  allowedOrigins: getEnv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(','),
  smtp: {
    host: getEnv('SMTP_HOST'),
    port: Number(getEnv('SMTP_PORT', '587')),
    secure: getEnv('SMTP_SECURE', 'false') === 'true',
    user: getEnv('SMTP_USER'),
    pass: getEnv('SMTP_PASS'),
    from: getEnv('SMTP_FROM', 'Sounmix <no-reply@sounmix.app>'),
  },
  otp: {
    expiresMinutes: Number(getEnv('OTP_EXPIRES_MINUTES', '10')),
  },
}

