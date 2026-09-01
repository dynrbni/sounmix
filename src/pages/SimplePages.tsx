import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, CheckCircle2, LockKeyhole, Music2, Trash2 } from 'lucide-react'

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

interface Operation {
  id: string
  type: string
  source: string
  destination?: string | null
  playlist: string
  status: string
  totalTracks: number
  successfulTracks: number
  startedAt: string
}

export function SimplePages({ page }: { page: string }) {
  if (page === 'Organize') return <OrganizePage />
  if (page === 'Duplicates') return <DuplicatesPage />
  if (page === 'Merge') return <MergePage />
  if (page === 'History') return <HistoryPage />
  return <SettingsPage />
}

function OrganizePage() {
  const [playlists, setPlaylists] = useState<LivePlaylist[]>([])
  const [source, setSource] = useState('')
  const [artist, setArtist] = useState('The Weeknd')
  const [destName, setDestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ foundTracks: number } | null>(null)

  useEffect(() => {
    fetch(`${apiUrl}/playlists`).then((r) => r.json()).then((res) => {
      if (res.success && res.data.length > 0) {
        setPlaylists(res.data)
        setSource(res.data[0].platformPlaylistId || res.data[0].id)
      }
    })
  }, [])

  async function handleMove() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/organizer/artist/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePlaylistId: source,
          artist,
          destinationPlaylistName: destName || `Best of ${artist}`,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setResult(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell eyebrow="Safe Move" title="Artist Organizer" description="Collect songs from one artist in your real playlist and move them into a dedicated collection.">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-black text-ink/50">Source Playlist</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm">
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.platformPlaylistId || pl.id}>{pl.name} ({pl.trackCount} tracks)</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black text-ink/50">Artist Name</span>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="e.g. The Weeknd" className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm outline-none focus:border-pulse" />
        </label>

        <label className="block">
          <span className="text-sm font-black text-ink/50">Destination Playlist Name</span>
          <input value={destName} onChange={(e) => setDestName(e.target.value)} placeholder={`Best of ${artist}`} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm outline-none focus:border-pulse" />
        </label>
      </div>

      <div className="mt-6 rounded-3xl bg-cloud p-5">
        <p className="flex items-center gap-2 font-black"><LockKeyhole size={18} />Transaction Safe</p>
        <p className="mt-2 text-sm font-semibold text-ink/55">Sounmix creates the target playlist on your real account, adds the artist tracks, and safely cleans the source playlist.</p>
      </div>

      {result && <Success text={`Successfully migrated ${result.foundTracks} tracks to your new playlist on Spotify/Apple Music!`} />}

      <button disabled={loading || !source || !artist} onClick={handleMove} className="mt-6 rounded-full bg-ink px-6 py-3 font-black text-white shadow-card hover:bg-pulse disabled:opacity-40">
        {loading ? 'Moving Tracks...' : 'Move Tracks Now'}
      </button>
    </Shell>
  )
}

function DuplicatesPage() {
  const [playlists, setPlaylists] = useState<LivePlaylist[]>([])
  const [playlistId, setPlaylistId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanData, setScanData] = useState<any>(null)
  const [removing, setRemoving] = useState(false)
  const [removed, setRemoved] = useState(false)

  useEffect(() => {
    fetch(`${apiUrl}/playlists`).then((r) => r.json()).then((res) => {
      if (res.success && res.data.length > 0) {
        setPlaylists(res.data)
        setPlaylistId(res.data[0].platformPlaylistId || res.data[0].id)
      }
    })
  }, [])

  async function handleScan() {
    if (!playlistId) return
    setScanning(true)
    setScanData(null)
    setRemoved(false)

    try {
      const res = await fetch(`${apiUrl}/duplicates/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId }),
      }).then((r) => r.json())

      if (res.success) {
        setScanData(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setScanning(false)
    }
  }

  async function handleRemove() {
    if (!scanData || scanData.groups.length === 0) return
    setRemoving(true)

    const urisToRemove: string[] = []
    scanData.groups.forEach((g: any) => {
      // Keep first track, remove subsequent duplicates
      g.tracks.slice(1).forEach((t: any) => {
        if (t.uri) urisToRemove.push(t.uri)
        else if (t.platformTrackId) urisToRemove.push(t.platformTrackId)
      })
    })

    try {
      const res = await fetch(`${apiUrl}/duplicates/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistId,
          trackUris: urisToRemove,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setRemoved(true)
        setScanData(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Shell eyebrow="Live Cleanup" title="Duplicate Cleaner" description="Scan real duplicate tracks in your playlists using ISRC and acoustic metadata matching.">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-sm font-black text-ink/50">Playlist to Scan</span>
          <select value={playlistId} onChange={(e) => { setPlaylistId(e.target.value); setScanData(null); setRemoved(false) }} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm">
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.platformPlaylistId || pl.id}>{pl.name} ({pl.trackCount} tracks)</option>
            ))}
          </select>
        </label>
        <button disabled={scanning || !playlistId} onClick={handleScan} className="self-end rounded-full bg-pulse px-6 py-3 font-black text-white shadow-card hover:opacity-90 disabled:opacity-40">
          {scanning ? 'Scanning Live...' : 'Scan Duplicates'}
        </button>
      </div>

      {scanData && (
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-lilac p-5">
            <p className="font-black text-pulse">Scan Results</p>
            <p className="mt-1 text-sm font-semibold text-ink/60">
              Scanned {scanData.totalTracks} tracks · Found {scanData.duplicateCount} duplicate occurrences across {scanData.groups.length} groups.
            </p>
          </div>

          <div className="space-y-3">
            {scanData.groups.map((group: any) => (
              <div key={group.id} className="rounded-2xl border border-ink/10 bg-cloud p-4">
                <p className="text-xs font-black uppercase tracking-wider text-pulse">Reason: {group.reason}</p>
                <div className="mt-2 space-y-1">
                  {group.tracks.map((t: any, i: number) => (
                    <p key={i} className="text-sm font-bold text-ink/80">
                      {i === 0 ? '✓ Keep: ' : '✗ Remove copy: '} {t.title} — {t.artist} ({t.album})
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button disabled={removing || scanData.duplicateCount === 0} onClick={handleRemove} className="rounded-full bg-rose-600 px-6 py-3 font-black text-white shadow-card hover:bg-rose-700 disabled:opacity-40">
            {removing ? 'Removing from playlist...' : `Remove ${scanData.duplicateCount} Duplicates from Spotify`}
          </button>
        </div>
      )}

      {removed && <Success text="Duplicate tracks successfully cleaned from your real playlist!" />}
    </Shell>
  )
}

function MergePage() {
  const [playlists, setPlaylists] = useState<LivePlaylist[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [name, setName] = useState('Ultimate Mega Mix')
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const [merging, setMerging] = useState(false)
  const [merged, setMerged] = useState(false)

  useEffect(() => {
    fetch(`${apiUrl}/playlists`).then((r) => r.json()).then((res) => {
      if (res.success && res.data.length > 0) {
        setPlaylists(res.data)
        if (res.data.length >= 2) {
          setSelectedIds([res.data[0].platformPlaylistId || res.data[0].id, res.data[1].platformPlaylistId || res.data[1].id])
        }
      }
    })
  }, [])

  function togglePlaylist(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleMerge() {
    if (selectedIds.length < 2) return
    setMerging(true)
    try {
      const res = await fetch(`${apiUrl}/playlists/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistIds: selectedIds,
          name,
          removeDuplicates,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setMerged(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setMerging(false)
    }
  }

  return (
    <Shell eyebrow="Combine" title="Merge Playlists" description="Combine 2 or more real playlists into a unified playlist with automatic deduplication.">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-black text-ink/50">New Merged Playlist Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm outline-none focus:border-pulse" />
        </label>

        <div>
          <span className="text-sm font-black text-ink/50">Select Playlists to Merge (Min. 2)</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {playlists.map((pl) => {
              const id = pl.platformPlaylistId || pl.id
              const isChecked = selectedIds.includes(id)
              return (
                <label key={pl.id} className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${isChecked ? 'border-pulse bg-lilac/40 shadow-sm' : 'border-ink/10 bg-cloud'}`}>
                  <div>
                    <p className="font-bold">{pl.name}</p>
                    <p className="text-xs text-ink/50">{pl.trackCount} tracks · {pl.platform.toUpperCase()}</p>
                  </div>
                  <input type="checkbox" checked={isChecked} onChange={() => togglePlaylist(id)} className="h-5 w-5 accent-pulse" />
                </label>
              )
            })}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-cloud p-4 font-bold text-sm">
          <input type="checkbox" checked={removeDuplicates} onChange={(e) => setRemoveDuplicates(e.target.checked)} className="h-5 w-5 accent-pulse" />
          Automatically remove duplicate tracks during merge
        </label>

        {merged && <Success text={`New merged playlist “${name}” created successfully on your real account!`} />}

        <button disabled={merging || selectedIds.length < 2 || !name} onClick={handleMerge} className="rounded-full bg-ink px-6 py-3 font-black text-white shadow-card hover:bg-pulse disabled:opacity-40">
          {merging ? 'Merging Live Playlists...' : 'Create Merged Playlist Now'}
        </button>
      </div>
    </Shell>
  )
}

function HistoryPage() {
  const [operations, setOperations] = useState<Operation[]>([])

  useEffect(() => {
    fetch(`${apiUrl}/operations`).then((r) => r.json()).then((res) => {
      if (res.success) setOperations(res.data)
    })
  }, [])

  return (
    <Shell eyebrow="Audit Trail" title="Operation History" description="Live audit log of all transfers, duplicate cleanups, artist moves, and playlist merges.">
      <div className="mt-5 space-y-3">
        {operations.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-ink/40">No operations recorded yet.</p>
        ) : (
          operations.map((op) => (
            <div key={op.id} className="grid gap-3 rounded-3xl bg-cloud p-4 md:grid-cols-[110px_1fr_150px_130px] md:items-center">
              <span className="text-xs font-black text-pulse">{op.type}</span>
              <span className="font-semibold text-ink/70">{op.playlist} ({op.source} {op.destination ? `→ ${op.destination}` : ''})</span>
              <span className="font-black text-sm">{op.successfulTracks} / {op.totalTracks} tracks</span>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{op.status}</span>
            </div>
          ))
        )}
      </div>
    </Shell>
  )
}

function SettingsPage() {
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    fetch(`${apiUrl}/accounts`).then((r) => r.json()).then((res) => {
      if (res.success) setAccounts(res.data)
    })
  }, [])

  return (
    <Shell eyebrow="Control Center" title="Settings & Platforms" description="Manage connected streaming accounts and OAuth permissions.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-cloud p-5">
          <p className="font-black">Spotify Web API</p>
          <p className="mt-1 text-xs text-ink/50">Full OAuth 2.0 PKCE integration for real playlists and library access.</p>
          <button onClick={() => window.location.href = `${apiUrl}/spotify/login`} className="mt-4 rounded-full bg-ink px-4 py-2 text-xs font-black text-white hover:bg-pulse">
            Re-authorize Spotify
          </button>
        </div>

        <div className="rounded-3xl bg-cloud p-5">
          <p className="font-black">Apple Music MusicKit</p>
          <p className="mt-1 text-xs text-ink/50">Music User Token & Developer Token library sync.</p>
          <button className="mt-4 rounded-full bg-ink px-4 py-2 text-xs font-black text-white hover:bg-pulse">
            Authorize Apple Music
          </button>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-black text-pulse">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">{title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/60">{description}</p>
      <div className="mt-6 rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">{children}</div>
    </div>
  )
}

function Success({ text }: { text: string }) {
  return <div className="mt-6 rounded-3xl bg-emerald-50 p-5 font-black text-emerald-700">{text}</div>
}
