import { useState, useEffect, useRef } from 'react'
import { ArrowRight, CheckCircle2, Clock, Disc3, Music2, Pause, Play, Sparkles, Volume2 } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

interface LivePlaylist {
  id: string
  platform: 'spotify' | 'apple-music'
  platformPlaylistId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  trackCount: number
  owner: string
  isPublic: boolean
}

interface LiveTrack {
  id: string
  platform: 'spotify' | 'apple-music'
  platformTrackId: string
  title: string
  artist: string
  album: string
  durationMs: number
  isrc?: string
  explicit?: boolean
  coverUrl?: string | null
  previewUrl?: string | null
}

export function PlaylistPreviewPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [playlists, setPlaylists] = useState<LivePlaylist[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [tracks, setTracks] = useState<LiveTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const res = await fetch(`${apiUrl}/playlists`).then((r) => r.json())
        if (res.success && res.data.length > 0) {
          setPlaylists(res.data)
          setSelectedId(res.data[0].platformPlaylistId || res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load playlists:', err)
      }
    }
    loadPlaylists()
  }, [])

  useEffect(() => {
    if (!selectedId) return

    async function loadTracks() {
      setLoading(true)
      try {
        const chosen = playlists.find((p) => (p.platformPlaylistId || p.id) === selectedId)
        const platform = chosen?.platform || 'spotify'
        const res = await fetch(`${apiUrl}/${platform}/playlists/${selectedId}/tracks`).then((r) => r.json())
        if (res.success) {
          setTracks(res.data)
        }
      } catch (err) {
        console.error('Failed to load playlist tracks:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTracks()
  }, [selectedId, playlists])

  function formatDuration(ms: number) {
    if (!ms) return '0:00'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  function handlePlayPreview(track: LiveTrack) {
    if (!track.previewUrl) return

    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(track.previewUrl)
    audioRef.current = audio
    audio.play()
    setPlayingId(track.id)

    audio.onended = () => {
      setPlayingId(null)
    }
  }

  const activePlaylist = playlists.find((p) => (p.platformPlaylistId || p.id) === selectedId)
  const totalDurationMs = tracks.reduce((sum, t) => sum + t.durationMs, 0)
  const totalMinutes = Math.round(totalDurationMs / 60000)

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-black text-pulse">Tracklist Viewer</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">Playlist Preview</h1>
          <p className="mt-2 text-sm font-semibold text-ink/60">
            Inspect all songs, play audio previews, and review metadata before transferring or organizing.
          </p>
        </div>

        <div className="w-full md:w-80">
          <label className="block text-xs font-black text-ink/50">Select Playlist to Inspect</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm outline-none focus:border-pulse"
          >
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.platformPlaylistId || pl.id}>
                {pl.name} ({pl.trackCount} tracks · {pl.platform.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Playlist Hero Banner */}
      {activePlaylist && (
        <div className="overflow-hidden rounded-[2.25rem] bg-ink p-6 text-white shadow-soft md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {activePlaylist.imageUrl ? (
              <img
                src={activePlaylist.imageUrl}
                alt={activePlaylist.name}
                className="h-32 w-32 rounded-3xl object-cover shadow-2xl ring-2 ring-white/10"
              />
            ) : (
              <div className="grid h-32 w-32 place-items-center rounded-3xl bg-white/10 text-mint shadow-inner">
                <Disc3 size={48} className="animate-spin-slow" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-pulse px-3 py-1 text-xs font-black text-white">
                  {activePlaylist.platform.toUpperCase()}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                  By {activePlaylist.owner}
                </span>
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{activePlaylist.name}</h2>
              <p className="mt-2 text-sm font-semibold text-white/60">
                {activePlaylist.description || 'Synchronized live playlist'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-white/70">
                <span className="flex items-center gap-1.5"><Music2 size={15} className="text-mint" /> {tracks.length} Real Tracks</span>
                <span className="flex items-center gap-1.5"><Clock size={15} className="text-mint" /> ~{totalMinutes} Minutes Total</span>
                <span className="flex items-center gap-1.5"><Sparkles size={15} className="text-mint" /> High Quality Audio Preview</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate?.('Transfer')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-ink shadow-card transition-all hover:bg-mint"
              >
                Transfer to Apple Music <ArrowRight size={15} />
              </button>
              <button
                onClick={() => onNavigate?.('Duplicates')}
                className="rounded-full bg-white/10 px-5 py-3 text-xs font-black text-white transition-all hover:bg-white/20"
              >
                Scan Duplicates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracks Table */}
      <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-black">All Songs ({tracks.length})</h3>
          <span className="text-xs font-bold text-ink/40">ISRC & Acoustic Metadata Indexed</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pulse border-t-transparent" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-12 text-center text-sm font-semibold text-ink/40">
            No tracks found in this playlist. Sync a Spotify playlist from the Overview tab.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => {
              const isPlaying = playingId === track.id
              return (
                <div
                  key={track.id || index}
                  className={`group flex items-center justify-between gap-4 rounded-2xl p-3.5 transition-all ${
                    isPlaying ? 'bg-lilac shadow-sm' : 'bg-cloud hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-black text-ink/40 group-hover:text-pulse">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="h-11 w-11 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink/30 shadow-sm">
                        <Music2 size={18} />
                      </div>
                    )}

                    <div>
                      <p className="font-black text-sm text-ink">{track.title}</p>
                      <p className="text-xs font-semibold text-ink/50">
                        {track.artist} · <span className="text-ink/40">{track.album}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {track.previewUrl && (
                      <button
                        onClick={() => handlePlayPreview(track)}
                        title={isPlaying ? 'Pause Preview' : 'Play 30s Audio Preview'}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-all ${
                          isPlaying
                            ? 'bg-pulse text-white shadow-sm'
                            : 'bg-white text-pulse shadow-sm hover:bg-pulse hover:text-white'
                        }`}
                      >
                        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                        <span>{isPlaying ? 'Playing' : 'Preview'}</span>
                      </button>
                    )}

                    <span className="text-xs font-black text-ink/50">
                      {formatDuration(track.durationMs)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
