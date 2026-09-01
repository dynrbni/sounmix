import { Router } from 'express'
import { liveStore, type Platform } from '../services/liveStore.js'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { config } from '../config/env.js'

export const accountsRouter = Router({ mergeParams: true })

accountsRouter.get('/spotify/login', (_request, response) => {
  const url = spotifyService.getAuthUrl()
  response.redirect(url)
})

accountsRouter.get('/spotify/auth-url', (_request, response) => {
  const url = spotifyService.getAuthUrl()
  response.json({ success: true, data: { url } })
})

accountsRouter.get('/spotify/callback', async (request, response) => {
  const code = request.query.code as string | undefined
  const error = request.query.error as string | undefined

  if (error || !code) {
    response.redirect(`${config.appUrl}/?error=${encodeURIComponent(error || 'Spotify authorization cancelled')}`)
    return
  }

  try {
    await spotifyService.exchangeCode(code)
    response.redirect(`${config.appUrl}/?connected=spotify`)
  } catch (err) {
    response.redirect(`${config.appUrl}/?error=${encodeURIComponent((err as Error).message)}`)
  }
})

accountsRouter.post('/apple-music/connect', async (request, response, next) => {
  try {
    const { musicUserToken, storefront } = request.body
    const account = await appleMusicService.connectAccount(musicUserToken || 'demo_token', storefront)
    response.json({ success: true, data: account })
  } catch (error) {
    next(error)
  }
})

accountsRouter.get('/', (_request, response) => {
  const accountsList = liveStore.getAllAccounts()
  response.json({ success: true, data: accountsList })
})

accountsRouter.get('/:platform/account', (request, response) => {
  const platform = request.params.platform as Platform
  const account = liveStore.getAccount(platform)

  if (!account || !account.connected) {
    response.status(404).json({
      success: false,
      error: { code: 'ACCOUNT_NOT_CONNECTED', message: `No ${platform} account connected` },
    })
    return
  }

  response.json({ success: true, data: account })
})

accountsRouter.get('/:platform', (request, response) => {
  const platform = request.params.platform as Platform
  const account = liveStore.getAccount(platform)

  if (!account || !account.connected) {
    response.status(404).json({
      success: false,
      error: { code: 'ACCOUNT_NOT_CONNECTED', message: `No ${platform} account connected` },
    })
    return
  }

  response.json({ success: true, data: account })
})

accountsRouter.post('/:platform/connect', async (request, response) => {
  const platform = request.params.platform as Platform
  if (platform === 'spotify') {
    const account = await spotifyService.exchangeCode('demo_code')
    response.json({ success: true, data: account })
  } else {
    const account = await appleMusicService.connectAccount('demo_token')
    response.json({ success: true, data: account })
  }
})

accountsRouter.delete('/:platform', (request, response) => {
  const platform = request.params.platform as Platform
  liveStore.removeAccount(platform)

  response.json({
    success: true,
    data: {
      platform,
      connected: false,
    },
  })
})
