import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import { ZodError } from 'zod'
import { config } from './config/env.js'
import { accountsRouter } from './routes/accountsRoutes.js'
import { authRouter } from './routes/authRoutes.js'
import { duplicatesRouter } from './routes/duplicatesRoutes.js'
import { mergeRouter } from './routes/mergeRoutes.js'
import { operationsRouter } from './routes/operationsRoutes.js'
import { organizerRouter } from './routes/organizerRoutes.js'
import { playlistsRouter } from './routes/playlistsRoutes.js'
import { transfersRouter } from './routes/transfersRoutes.js'

import cookieParser from 'cookie-parser'
import { authMiddleware } from './middleware/authMiddleware.js'
import { tracksRouter } from './routes/tracksRoutes.js'

export const app = express()

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
)
app.use(cors({ origin: config.allowedOrigins, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(authMiddleware)


app.get('/api/v1/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok' } })
})


app.use('/api/v1/auth', authRouter)
app.use('/api/v1/accounts', accountsRouter)
app.use('/api/v1/playlists', playlistsRouter)
app.use('/api/v1/playlists', mergeRouter)
app.use('/api/v1/merge', mergeRouter)
app.use('/api/v1/tracks', tracksRouter)
app.use('/api/v1/transfers', transfersRouter)
app.use('/api/v1/duplicates', duplicatesRouter)
app.use('/api/v1/organizer', organizerRouter)
app.use('/api/v1/operations', operationsRouter)

// Platform-specific aliases: /api/v1/spotify/account, /api/v1/spotify/tracks, /api/v1/spotify/playlists, etc.
app.use('/api/v1', playlistsRouter)
app.use('/api/v1', accountsRouter)
app.use('/api/v1', tracksRouter)


const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
      },
    })
    return
  }

  if (error instanceof Error && error.message === 'SMTP_NOT_CONFIGURED') {
    response.status(500).json({
      success: false,
      error: {
        code: 'SMTP_NOT_CONFIGURED',
        message: 'SMTP credentials are required to send OTP emails',
      },
    })
    return
  }

  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    },
  })
}

app.use(errorHandler)
