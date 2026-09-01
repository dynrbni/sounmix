import { Router } from 'express'
import { z } from 'zod'
import { spotifyService } from '../services/spotifyService.js'
import { appleMusicService } from '../services/appleMusicService.js'
import { liveStore, type Platform, type LiveTrack } from '../services/liveStore.js'
import { normalizeString } from '../engine/normalizer.js'

const scanSchema = z.object({
  playlistId: z.string(),
  platform: z.enum(['spotify', 'apple-music']).default('spotify'),
})

const removeSchema = z.object({
  playlistId: z.string(),
  platform: z.enum(['spotify', 'apple-music']).default('spotify'),
  trackUris: z.array(z.string()).min(1),
})

export const duplicatesRouter = Router()

duplicatesRouter.post('/scan', async (request, response, next) => {
  try {
    const input = scanSchema.parse(request.body)
    const platform = input.platform as Platform

    const tracks = platform === 'spotify'
      ? await spotifyService.getPlaylistTracks(input.playlistId)
      : await appleMusicService.getPlaylistTracks(input.playlistId)

    // Detect duplicates by ISRC or normalized title+artist
    const isrcMap = new Map<string, LiveTrack[]>()
    const titleArtistMap = new Map<string, LiveTrack[]>()

    for (const track of tracks) {
      if (track.isrc) {
        const list = isrcMap.get(track.isrc) || []
        list.push(track)
        isrcMap.set(track.isrc, list)
      }

      const key = `${normalizeString(track.title)}__${normalizeString(track.artist)}`
      const list = titleArtistMap.get(key) || []
      list.push(track)
      titleArtistMap.set(key, list)
    }

    const groups: { id: string; reason: string; tracks: LiveTrack[] }[] = []
    let totalDuplicates = 0

    // Collect ISRC duplicates
    for (const [isrc, list] of isrcMap.entries()) {
      if (list.length > 1) {
        groups.push({
          id: `dup_isrc_${isrc}`,
          reason: 'ISRC_MATCH',
          tracks: list,
        })
        totalDuplicates += list.length - 1
      }
    }

    // Collect title+artist duplicates (if not already covered by ISRC)
    for (const [key, list] of titleArtistMap.entries()) {
      if (list.length > 1) {
        const hasIsrcMatch = list.some((t) => t.isrc && isrcMap.get(t.isrc) && isrcMap.get(t.isrc)!.length > 1)
        if (!hasIsrcMatch) {
          groups.push({
            id: `dup_meta_${key}`,
            reason: 'NORMALIZED_METADATA_MATCH',
            tracks: list,
          })
          totalDuplicates += list.length - 1
        }
      }
    }

    response.json({
      success: true,
      data: {
        playlistId: input.playlistId,
        platform,
        totalTracks: tracks.length,
        duplicateCount: totalDuplicates,
        groups,
      },
    })
  } catch (error) {
    next(error)
  }
})

duplicatesRouter.post('/remove', async (request, response, next) => {
  try {
    const input = removeSchema.parse(request.body)
    const platform = input.platform as Platform

    if (platform === 'spotify') {
      await spotifyService.removeTracksFromPlaylist(input.playlistId, input.trackUris)
    }

    liveStore.operations.unshift({
      id: `op_dup_${Date.now()}`,
      type: 'DUPLICATE_REMOVE',
      source: platform,
      playlist: input.playlistId,
      status: 'COMPLETED',
      totalTracks: input.trackUris.length,
      successfulTracks: input.trackUris.length,
      failedTracks: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

    response.json({
      success: true,
      data: {
        playlistId: input.playlistId,
        removedCount: input.trackUris.length,
        libraryTracksDeleted: false,
      },
    })
  } catch (error) {
    next(error)
  }
})
