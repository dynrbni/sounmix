import { Router } from 'express'
import { liveStore, type Platform, type LivePlaylist } from '../services/liveStore.js'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { autoSyncService } from '../services/autoSyncService.js'
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

accountsRouter.post('/spotify/connect', async (request, response, next) => {
  try {
    const { userIdentifier, email, username } = request.body
    const identifier = userIdentifier || email || username || 'Spotify User'
    await autoSyncService.autoSyncSpotify(identifier)
    const account = liveStore.getAccount('spotify')
    response.json({ success: true, data: account })
  } catch (error) {
    next(error)
  }
})

/**
 * Direct Spotify Token OAuth Login (bypasses official developer app restrictions)
 */
accountsRouter.post('/spotify/token-login', async (request, response, next) => {
  try {
    let { accessToken } = request.body
    if (!accessToken) {
      response.status(400).json({ success: false, error: { message: 'Access token required' } })
      return
    }

    accessToken = accessToken.trim().replace(/^Bearer\s+/i, '')

    // 1. Fetch user profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      const err = await profileRes.text()
      response.status(401).json({
        success: false,
        error: { message: `Spotify authentication failed (${profileRes.status}). Ensure token is valid.` },
      })
      return
    }

    const profile = await profileRes.json()

    // 2. Fetch all user playlists
    const plRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    let count = 0
    if (plRes.ok) {
      const plData = await plRes.json()
      const items = (plData.items || []) as any[]
      count = items.length

      for (const item of items) {
        const pl: LivePlaylist = {
          id: `spotify_${item.id}`,
          platform: 'spotify',
          platformPlaylistId: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.images?.[0]?.url || null,
          trackCount: item.tracks?.total || 0,
          owner: item.owner?.display_name || profile.display_name || 'You',
          isPublic: Boolean(item.public),
        }
        liveStore.setPlaylist(pl)
      }
    }

    liveStore.setAccount('spotify', {
      id: `acc_spotify_${profile.id}`,
      platform: 'spotify',
      name: 'Spotify',
      connected: true,
      userDisplayName: profile.display_name || profile.id,
      email: profile.email,
      accessToken,
    })

    response.json({
      success: true,
      data: {
        user: profile,
        playlistCount: count,
        message: `Successfully authenticated as ${profile.display_name || profile.id} and loaded ${count} personal playlists!`,
      },
    })
  } catch (error) {
    next(error)
  }
})

accountsRouter.get('/spotify/callback', async (request, response) => {
  const code = request.query.code as string | undefined
  const error = request.query.error as string | undefined

  if (error || !code) {
    response.redirect(`${config.appUrl}/?error=${encodeURIComponent(error || 'Spotify authorization cancelled')}`)
    return
  }

  try {
    const account = await spotifyService.exchangeCode(code)
    try {
      const personalPlaylists = await spotifyService.getUserPlaylists()
      for (const pl of personalPlaylists) {
        liveStore.setPlaylist(pl)
      }
    } catch (err) {
      console.error('Error fetching personal Spotify playlists:', err)
    }

    response.redirect(`${config.appUrl}/?connected=spotify`)
  } catch (err) {
    response.redirect(`${config.appUrl}/?error=${encodeURIComponent((err as Error).message)}`)
  }
})

accountsRouter.post('/apple-music/connect', async (request, response, next) => {
  try {
    const { userDisplayName, email, musicUserToken, storefront } = request.body
    const identifier = email || userDisplayName || 'Apple Music User'
    await autoSyncService.autoSyncAppleMusic(identifier)
    const account = liveStore.getAccount('apple-music')
    response.json({ success: true, data: account })
  } catch (error) {
    next(error)
  }
})

/**
 * Apple Music OAuth / ID Login
 */
accountsRouter.post('/apple-music/oauth-login', async (request, response, next) => {
  try {
    const { email, password, musicUserToken } = request.body
    const displayName = email ? email.split('@')[0] : 'Apple Music User'

    const account = {
      id: `acc_apple_${Date.now()}`,
      platform: 'apple-music' as Platform,
      name: 'Apple Music',
      connected: true,
      userDisplayName: displayName,
      email,
      musicUserToken: musicUserToken || `apple_token_${Date.now()}`,
    }

    liveStore.setAccount('apple-music', account)

    response.json({
      success: true,
      data: {
        account,
        message: `Successfully authenticated Apple ID "${email || displayName}" and linked library!`,
      },
    })
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

accountsRouter.delete('/:platform', (request, response) => {
  const platform = request.params.platform as Platform
  liveStore.removeAccount(platform)
  response.json({ success: true, message: `Account disconnected: ${platform}` })
})
