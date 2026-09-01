import { liveStore, type LiveTrack, type TransferJob, type Platform } from './liveStore.js'
import { spotifyService } from './spotifyService.js'
import { appleMusicService } from './appleMusicService.js'
import { matchTrack } from '../engine/matcherPipeline.js'

export class TransferEngine {
  async startTransfer(
    sourcePlatform: Platform,
    destinationPlatform: Platform,
    sourcePlaylistId: string,
    destinationPlaylistName?: string
  ): Promise<TransferJob> {
    const id = `job_${Date.now()}`

    // Fetch source tracks
    const sourceTracks = sourcePlatform === 'spotify'
      ? await spotifyService.getPlaylistTracks(sourcePlaylistId)
      : await appleMusicService.getPlaylistTracks(sourcePlaylistId)

    const job: TransferJob = {
      id,
      sourcePlatform,
      destinationPlatform,
      sourcePlaylistId,
      playlistName: destinationPlaylistName || 'Transferred Playlist',
      status: 'MATCHING',
      progress: {
        current: 0,
        total: sourceTracks.length,
        percent: 0,
      },
      result: {
        matched: 0,
        uncertain: 0,
        unavailable: 0,
        matchedTracks: [],
      },
      startedAt: new Date().toISOString(),
    }

    liveStore.transferJobs.set(id, job)

    // Execute matching & transfer asynchronously in background
    this.executeJob(job, sourceTracks).catch((err) => {
      job.status = 'FAILED'
      console.error(`[TRANSFER ENGINE] Job ${id} failed:`, err)
    })

    return job
  }

  private async executeJob(job: TransferJob, sourceTracks: LiveTrack[]) {
    const matchedUris: string[] = []
    const matchedTrackDetails: { source: LiveTrack; destination?: LiveTrack; confidence: string }[] = []

    for (let i = 0; i < sourceTracks.length; i++) {
      const srcTrack = sourceTracks[i]
      let destTrack: LiveTrack | null = null
      let confidence = 'UNMATCHED'

      // Search on destination platform
      if (job.destinationPlatform === 'spotify') {
        const candidates = await spotifyService.searchTrack(`${srcTrack.title} ${srcTrack.artist}`, srcTrack.isrc)
        const matchResult = matchTrack(srcTrack, candidates)
        if (matchResult) {
          destTrack = matchResult.match as LiveTrack
          confidence = matchResult.confidence >= 0.95 ? 'EXACT' : 'HIGH'
          if (destTrack.uri) matchedUris.push(destTrack.uri)
        }
      } else {
        const candidates = await appleMusicService.searchSong(`${srcTrack.title} ${srcTrack.artist}`, srcTrack.isrc)
        const matchResult = matchTrack(srcTrack, candidates)
        if (matchResult) {
          destTrack = matchResult.match as LiveTrack
          confidence = matchResult.confidence >= 0.95 ? 'EXACT' : 'HIGH'
          if (destTrack.platformTrackId) matchedUris.push(destTrack.platformTrackId)
        }
      }

      matchedTrackDetails.push({
        source: srcTrack,
        destination: destTrack || undefined,
        confidence,
      })

      job.progress.current = i + 1
      job.progress.percent = Math.round(((i + 1) / sourceTracks.length) * 100)
    }

    job.status = 'TRANSFERRING'

    // Create target playlist and add tracks
    let createdPlaylistId = ''
    if (job.destinationPlatform === 'spotify') {
      const newPlaylist = await spotifyService.createPlaylist(job.playlistName)
      createdPlaylistId = newPlaylist.platformPlaylistId
      if (matchedUris.length > 0) {
        await spotifyService.addTracksToPlaylist(newPlaylist.platformPlaylistId, matchedUris)
      }
    } else {
      const newPlaylist = await appleMusicService.createPlaylist(job.playlistName)
      createdPlaylistId = newPlaylist.platformPlaylistId
      if (matchedUris.length > 0) {
        await appleMusicService.addTracksToPlaylist(newPlaylist.platformPlaylistId, matchedUris)
      }
    }

    const matchedCount = matchedTrackDetails.filter((t) => t.destination).length
    const unavailableCount = sourceTracks.length - matchedCount

    job.status = 'COMPLETED'
    job.completedAt = new Date().toISOString()
    job.result = {
      matched: matchedCount,
      uncertain: 0,
      unavailable: unavailableCount,
      matchedTracks: matchedTrackDetails,
      createdPlaylistId,
    }

    // Add to operations history
    liveStore.operations.unshift({
      id: `op_${Date.now()}`,
      type: 'TRANSFER',
      source: job.sourcePlatform,
      destination: job.destinationPlatform,
      playlist: job.playlistName,
      status: 'COMPLETED',
      totalTracks: sourceTracks.length,
      successfulTracks: matchedCount,
      failedTracks: unavailableCount,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    })
  }
}

export const transferEngine = new TransferEngine()
