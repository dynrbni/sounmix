import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowDown, CheckCircle2, CircleDot, Loader2, XCircle } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

interface LivePlaylist {
  id: string
  platform: 'spotify' | 'apple-music'
  platformPlaylistId: string
  name: string
  trackCount: number
  owner: string
  imageUrl?: string | null
}

interface LiveTrack {
  id: string
  title: string
  artist: string
  album: string
  durationMs: number
  isrc?: string
  coverUrl?: string | null
}

interface TransferResult {
  id: string
  status: string
  progress: { current: number; total: number; percent: number }
  result?: {
    matched: number
    uncertain: number
    unavailable: number
    createdPlaylistId?: string
    matchedTracks?: { source: LiveTrack; destination?: LiveTrack; confidence: string }[]
  }
}

export function TransferPage() {
  const [sourcePlatform, setSourcePlatform] = useState<'spotify' | 'apple-music'>('spotify')
  const [destinationPlatform, setDestinationPlatform] = useState<'spotify' | 'apple-music'>('apple-music')
  const [playlists, setPlaylists] = useState<LivePlaylist[]>([])
  const [sourcePlaylistId, setSourcePlaylistId] = useState('')
  const [targetPlaylistName, setTargetPlaylistName] = useState('')
  const [tracks, setTracks] = useState<LiveTrack[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [job, setJob] = useState<TransferResult | null>(null)

  useEffect(() => {
    async function loadPlaylists() {
      try {
        const res = await fetch(`${apiUrl}/playlists`).then((r) => r.json())
        if (res.success && res.data.length > 0) {
          setPlaylists(res.data)
          const first = res.data.find((p: LivePlaylist) => p.platform === sourcePlatform)
          if (first) {
            setSourcePlaylistId(first.platformPlaylistId || first.id)
            setTargetPlaylistName(`${first.name} (Sounmix)`)
          }
        }
      } catch (err) {
        console.error('Error loading playlists:', err)
      }
    }
    loadPlaylists()
  }, [])

  const sourcePlaylists = playlists.filter((p) => p.platform === sourcePlatform)
  const sourcePlaylist = sourcePlaylists.find((p) => (p.platformPlaylistId || p.id) === sourcePlaylistId) || sourcePlaylists[0]

  async function handleAnalyze() {
    if (!sourcePlaylistId && sourcePlaylist) {
      setSourcePlaylistId(sourcePlaylist.platformPlaylistId || sourcePlaylist.id)
    }

    const plId = sourcePlaylistId || sourcePlaylist?.platformPlaylistId || sourcePlaylist?.id
    if (!plId) return

    setAnalyzing(true)
    setAnalyzed(false)
    setJob(null)

    try {
      const res = await fetch(`${apiUrl}/${sourcePlatform}/playlists/${plId}/tracks`).then((r) => r.json())
      if (res.success) {
        setTracks(res.data)
        setAnalyzed(true)
      }
    } catch (err) {
      console.error('Error fetching tracks:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleStartTransfer() {
    const plId = sourcePlaylistId || sourcePlaylist?.platformPlaylistId || sourcePlaylist?.id
    if (!plId) return

    setTransferring(true)
    try {
      const res = await fetch(`${apiUrl}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePlatform,
          destinationPlatform,
          sourcePlaylistId: plId,
          destinationPlaylistName: targetPlaylistName || `${sourcePlaylist?.name || 'Playlist'} (Sounmix)`,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setJob(res.data)
        // Poll status
        const jobId = res.data.id
        const interval = setInterval(async () => {
          const pollRes = await fetch(`${apiUrl}/transfers/${jobId}`).then((r) => r.json())
          if (pollRes.success) {
            setJob(pollRes.data)
            if (pollRes.data.status === 'COMPLETED' || pollRes.data.status === 'FAILED') {
              clearInterval(interval)
              setTransferring(false)
            }
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Error transferring:', err)
      setTransferring(false)
    }
  }

  const matchedCount = job?.result?.matched ?? (analyzed ? tracks.length : 0)
  const missingCount = job?.result?.unavailable ?? 0

  return (
    <div className="space-y-6">
      <div>
        <p className="font-black text-pulse">Live Migration Flow</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">Transfer Music</h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink/60">Choose source and target platforms, analyze tracks with our 3-tier matching engine, and transfer to your real account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3 rounded-3xl bg-lilac p-4">
            <CircleDot className="text-pulse" size={20} />
            <div>
              <p className="font-black">Step 1 of 3</p>
              <p className="text-sm font-semibold text-ink/55">Choose where the playlist comes from and where it should go.</p>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-3xl bg-cloud p-5">
              <p className="text-sm font-black uppercase tracking-widest text-pulse">From (Source)</p>
              <label className="mt-3 block text-xs font-black text-ink/50">Platform</label>
              <select
                value={sourcePlatform}
                onChange={(e) => {
                  const p = e.target.value as 'spotify' | 'apple-music'
                  setSourcePlatform(p)
                  const first = playlists.find((item) => item.platform === p)
                  setSourcePlaylistId(first?.platformPlaylistId || first?.id || '')
                  setAnalyzed(false)
                  setJob(null)
                }}
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm"
              >
                <option value="spotify">Spotify</option>
                <option value="apple-music">Apple Music</option>
              </select>

              <label className="mt-4 block text-xs font-black text-ink/50">Playlist</label>
              <select
                value={sourcePlaylistId}
                onChange={(e) => {
                  setSourcePlaylistId(e.target.value)
                  const chosen = playlists.find((p) => (p.platformPlaylistId || p.id) === e.target.value)
                  if (chosen) setTargetPlaylistName(`${chosen.name} (Sounmix)`)
                  setAnalyzed(false)
                  setJob(null)
                }}
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm"
              >
                {sourcePlaylists.length === 0 ? (
                  <option value="">No playlists found on {sourcePlatform}</option>
                ) : (
                  sourcePlaylists.map((pl) => (
                    <option key={pl.id} value={pl.platformPlaylistId || pl.id}>
                      {pl.name} ({pl.trackCount} tracks)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-center">
              <div className="rounded-full bg-ink p-3 text-white shadow-card"><ArrowDown size={20} /></div>
            </div>

            <div className="rounded-3xl bg-cloud p-5">
              <p className="text-sm font-black uppercase tracking-widest text-pulse">To (Destination)</p>
              <label className="mt-3 block text-xs font-black text-ink/50">Platform</label>
              <select
                value={destinationPlatform}
                onChange={(e) => setDestinationPlatform(e.target.value as 'spotify' | 'apple-music')}
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm"
              >
                <option value="apple-music">Apple Music</option>
                <option value="spotify">Spotify</option>
              </select>

              <label className="mt-4 block text-xs font-black text-ink/50">Target Playlist Name</label>
              <input
                value={targetPlaylistName}
                onChange={(e) => setTargetPlaylistName(e.target.value)}
                placeholder="e.g. My Transferred Hits"
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm outline-none focus:border-pulse"
              />
            </div>

            <button
              disabled={analyzing || !sourcePlaylist}
              onClick={handleAnalyze}
              className="rounded-full bg-pulse px-6 py-4 font-black text-white shadow-card transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing Real Tracks...' : 'Analyze Playlist'}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Review Before Transfer</h2>
              <p className="mt-1 text-sm font-semibold text-ink/50">
                {analyzed ? `Found ${tracks.length} real tracks in “${sourcePlaylist?.name || 'Playlist'}”.` : 'Analyze playlist to preview real tracks.'}
              </p>
            </div>
            <span className="flex w-fit items-center gap-2 rounded-full bg-lilac px-3 py-1 text-sm font-black text-pulse">
              <Loader2 size={15} className={transferring ? 'animate-spin' : ''} />
              {job?.status || (analyzed ? 'Ready' : 'Waiting')}
            </span>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-ink p-5 text-white">
            <div className="mb-3 flex justify-between text-sm font-bold text-white/65">
              <span>Transfer Progress</span>
              <span>{job?.progress ? `${job.progress.percent}%` : analyzed ? '100%' : '0%'}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-mint transition-all duration-300"
                style={{ width: `${job?.progress?.percent || (analyzed ? 100 : 0)}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-white/55">
              {job ? `${job.progress.current} of ${job.progress.total} tracks processed` : analyzed ? `${tracks.length} tracks ready to match` : 'Analysis has not started'}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 size={18} />
              <p className="mt-2 text-xs font-black">Matched Tracks</p>
              <p className="text-2xl font-black">{matchedCount}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4 text-amber-800">
              <AlertTriangle size={18} />
              <p className="mt-2 text-xs font-black">Confidence</p>
              <p className="text-2xl font-black">98%</p>
            </div>
            <div className="rounded-3xl bg-rose-50 p-4 text-rose-800">
              <XCircle size={18} />
              <p className="mt-2 text-xs font-black">Missing</p>
              <p className="text-2xl font-black">{missingCount}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-cloud p-5">
            <p className="font-black">Preview Tracks ({tracks.length})</p>
            <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-2">
              {tracks.length === 0 ? (
                <p className="text-xs font-semibold text-ink/40">No tracks loaded yet.</p>
              ) : (
                tracks.map((t, idx) => (
                  <div key={t.id || idx} className="flex items-center justify-between rounded-xl bg-white p-2.5 text-xs shadow-sm">
                    <div>
                      <p className="font-bold">{t.title}</p>
                      <p className="text-ink/50">{t.artist} · {t.album}</p>
                    </div>
                    {t.isrc && <span className="rounded-md bg-lilac px-2 py-0.5 font-mono text-[10px] font-black text-pulse">{t.isrc}</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {job?.status === 'COMPLETED' && (
            <div className="mt-6 rounded-3xl bg-emerald-50 p-5 font-black text-emerald-700">
              Transfer completed successfully! {job.result?.matched} tracks added to {destinationPlatform.toUpperCase()}.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => { setAnalyzed(false); setJob(null) }}
              className="rounded-full border border-ink/10 bg-white px-6 py-3 font-black"
            >
              Reset
            </button>
            <button
              disabled={!analyzed || transferring || tracks.length === 0}
              onClick={handleStartTransfer}
              className="rounded-full bg-ink px-6 py-3 font-black text-white shadow-card transition-all hover:bg-pulse disabled:opacity-40"
            >
              {transferring ? 'Transferring Live...' : `Transfer ${tracks.length} Tracks Now`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
