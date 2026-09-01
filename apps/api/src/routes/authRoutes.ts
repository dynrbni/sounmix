import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config/env.js'
import { sendOtpEmail } from '../services/emailService.js'
import { createOtpChallenge, verifyOtpChallenge } from '../services/otpService.js'

const emailSchema = z.object({
  email: z.string().email(),
})

const verifySchema = emailSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
})

export const authRouter = Router()

authRouter.get('/me', (_request, response) => {
  response.json({
    success: true,
    data: {
      id: 'demo-user',
      email: 'demo@sounmix.app',
      displayName: 'Sounmix Demo',
      otpEnabled: true,
    },
  })
})

authRouter.post('/otp/send', async (request, response, next) => {
  try {
    const { email } = emailSchema.parse(request.body)
    const otp = createOtpChallenge(email, config.otp.expiresMinutes)

    const sendResult = await sendOtpEmail(email, otp)

    response.json({
      success: true,
      data: {
        message: 'OTP sent to email',
        expiresInMinutes: config.otp.expiresMinutes,
        deliveryMode: sendResult.mode,
        previewUrl: sendResult.previewUrl,
        devOtp: sendResult.mode !== 'smtp' ? otp : undefined,
      },
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/otp/verify', (request, response, next) => {
  try {
    const { email, otp } = verifySchema.parse(request.body)
    const result = verifyOtpChallenge(email, otp)

    if (!result.ok) {
      response.status(400).json({
        success: false,
        error: {
          code: result.code,
          message: 'OTP verification failed',
        },
      })
      return
    }

    response.json({
      success: true,
      data: {
        message: 'OTP verified successfully',
      },
    })
  } catch (error) {
    next(error)
  }
})
