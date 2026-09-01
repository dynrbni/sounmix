import { Router } from 'express'
import { z } from 'zod'
import { spotifyService } from '../services/spotifyService.js'
import { liveStore, type Platform, type LiveTrack } from '../services/liveStore.js'

const mergeSchema = z.object({
  playlistIds: z.array(z.string()).min(2),
  name: z.string().min(1),
  platform: z.enum(['spotify', 'apple-music']).default('spotify'),
  removeDuplicates: z.boolean().default(true),
})

export const mergeRouter = Router()

mergeRouter.post('/merge', async (request, response, next) => {
  try {
    const input = mergeSchema.parse(request.body)
    const platform = input.platform as Platform

    let allTracks: LiveTrack[] = []
    for (const plId of input.playlistIds) {
      const plTracks = platform === 'spotify'
        ? await spotifyService.getPlaylistTracks(plId)
        : []
      allTracks = [...allTracks, ...plTracks]
    }

    const rawTotal = allTracks.length
    let finalTracks = allTracks

    if (input.removeDuplicates) {
      const seen = new Set<string>()
      finalTracks = allTracks.filter((track) => {
        const key = track.isrc || `${track.title.toLowerCase()}__${track.artist.toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    const duplicateCount = rawTotal - finalTracks.length

    // Create new merged playlist on Spotify
    let createdPlaylistId = `merged_${Date.now()}`
    if (platform === 'spotify') {
      const newPlaylist = await spotifyService.createPlaylist(input.name, 'Merged with Sounmix')
      createdPlaylistId = newPlaylist.platformPlaylistId
      const uris = finalTracks.map((t) => t.uri).filter(Boolean) as string[]
      if (uris.length > 0) {
        await spotifyService.addTracksToPlaylist(createdPlaylistId, uris)
      }
    }

    liveStore.operations.unshift({
      id: `op_merge_${Date.now()}`,
      type: 'PLAYLIST_MERGE',
      source: platform,
      playlist: input.name,
      status: 'COMPLETED',
      totalTracks: rawTotal,
      successfulTracks: finalTracks.length,
      failedTracks: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

    response.status(201).json({
      success: true,
      data: {
        id: createdPlaylistId,
        name: input.name,
        rawTotal,
        duplicateCount,
        finalTotal: finalTracks.length,
      },
    })
  } catch (error) {
    next(error)
  }
})
