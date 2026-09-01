import { Router } from 'express'
import { accounts, type Platform } from '../services/demoData.js'


export const accountsRouter = Router({ mergeParams: true })

accountsRouter.get('/', (_request, response) => {
  response.json({ success: true, data: accounts })
})

accountsRouter.get('/:platform/account', (request, response) => {
  const platform = request.params.platform
  const account = accounts.find((item) => item.platform === platform)

  if (!account) {
    response.status(404).json({
      success: false,
      error: { code: 'ACCOUNT_NOT_CONNECTED', message: `No ${platform} account connected` },
    })
    return
  }

  response.json({ success: true, data: account })
})

accountsRouter.get('/:platform', (request, response) => {
  const platform = request.params.platform
  const account = accounts.find((item) => item.platform === platform)

  if (!account) {
    response.status(404).json({
      success: false,
      error: { code: 'ACCOUNT_NOT_CONNECTED', message: `No ${platform} account connected` },
    })
    return
  }

  response.json({ success: true, data: account })
})

accountsRouter.post('/:platform/connect', (request, response) => {
  const platform = request.params.platform as Platform
  const existing = accounts.find((item) => item.platform === platform)

  if (existing) {
    existing.connected = true
    response.json({ success: true, data: existing })
    return
  }

  const newAccount = {
    id: `acc_${platform}`,
    platform,
    name: platform === 'spotify' ? 'Spotify' : 'Apple Music',
    connected: true,
    platformUserId: `${platform}_user_demo`,
    userDisplayName: `Sounmix ${platform} User`,
    scopes: platform === 'spotify' ? ['playlist-read-private', 'playlist-modify-private'] : ['music-library'],
  }
  accounts.push(newAccount)

  response.json({ success: true, data: newAccount })
})

accountsRouter.delete('/:platform', (request, response) => {
  const platform = request.params.platform
  const account = accounts.find((item) => item.platform === platform)
  if (account) {
    account.connected = false
  }

  response.json({
    success: true,
    data: {
      platform,
      connected: false,
    },
  })
})

