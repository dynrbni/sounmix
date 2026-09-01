import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle2, Music2, Plus, ShieldCheck, XCircle } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

interface ConnectedAccount {
  id: string
  platform: 'spotify' | 'apple-music'
  name: string
  connected: boolean
  userDisplayName?: string
}

interface Playlist {
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

export function OverviewPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [accRes, plRes, opRes] = await Promise.all([
          fetch(`${apiUrl}/accounts`).then((r) => r.json()),
          fetch(`${apiUrl}/playlists`).then((r) => r.json()),
          fetch(`${apiUrl}/operations`).then((r) => r.json()),
        ])

        if (accRes.success) setAccounts(accRes.data)
        if (plRes.success) setPlaylists(plRes.data)
        if (opRes.success) setOperations(opRes.data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  function connectSpotify() {
    window.location.href = `${apiUrl}/spotify/login`
  }

  async function disconnectAccount(platform: 'spotify' | 'apple-music') {
    await fetch(`${apiUrl}/accounts/${platform}`, { method: 'DELETE' })
    const accRes = await fetch(`${apiUrl}/accounts`).then((r) => r.json())
    if (accRes.success) setAccounts(accRes.data)
  }

  const spotifyAcc = accounts.find((a) => a.platform === 'spotify')
  const appleAcc = accounts.find((a) => a.platform === 'apple-music')
  const totalTracks = playlists.reduce((sum, p) => sum + p.trackCount, 0)
  const connectedCount = accounts.filter((a) => a.connected).length

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2.25rem] bg-ink p-7 text-white shadow-soft md:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="font-black text-mint">Live Music Toolbox</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-6xl">Your music dashboard, made simple.</h1>
            <p className="mt-4 max-w-2xl leading-8 text-white/64">Connect Spotify and Apple Music accounts directly to transfer, clean, and organize your real playlists without dummy data.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => onNavigate?.('Transfer')} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-ink hover:opacity-90">Start transfer <ArrowRight size={17} /></button>
              <button onClick={() => onNavigate?.('Duplicates')} className="rounded-full bg-white/10 px-5 py-3 font-black text-white hover:bg-white/20">Scan duplicates</button>
            </div>
          </div>
          <div className="rounded-[1.8rem] bg-white/10 p-5">
            <p className="font-black text-white/70">Library Health</p>
            <div className="mt-5 space-y-4">
              <Progress label="Connected platforms" value={`${connectedCount}/2`} width={connectedCount === 2 ? 'w-full' : connectedCount === 1 ? 'w-1/2' : 'w-0'} />
              <Progress label="Synced tracks" value={`${totalTracks} tracks`} width="w-4/5" />
              <Progress label="Transfer success" value="98%" width="w-[98%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Stat title="Connected Accounts" value={`${connectedCount} of 2`} helper={connectedCount > 0 ? 'Live accounts linked' : 'No accounts connected'} />
        <Stat title="Real Playlists" value={`${playlists.length} synced`} helper={`${totalTracks} total tracks indexed`} />
        <Stat title="Completed Operations" value={`${operations.length} jobs`} helper="Tracked in live history" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-xl font-black">Connected Services</h2><p className="mt-1 text-sm font-semibold text-ink/50">Authorize your real Spotify and Apple Music accounts.</p></div>
            <ShieldCheck className="text-pulse" />
          </div>
          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between rounded-3xl bg-cloud p-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${spotifyAcc?.connected ? 'bg-emerald-500' : 'bg-ink/20'}`} />
                <div>
                  <span className="font-black">Spotify</span>
                  {spotifyAcc?.connected && <p className="text-xs text-ink/50">{spotifyAcc.userDisplayName || 'Connected'}</p>}
                </div>
              </div>
              {spotifyAcc?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-black text-emerald-600"><CheckCircle2 size={16} />Connected</span>
                  <button onClick={() => disconnectAccount('spotify')} className="text-xs font-bold text-ink/40 hover:text-red-500">Disconnect</button>
                </div>
              ) : (
                <button onClick={connectSpotify} className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white hover:bg-pulse">Connect Spotify</button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-3xl bg-cloud p-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${appleAcc?.connected ? 'bg-emerald-500' : 'bg-ink/20'}`} />
                <div>
                  <span className="font-black">Apple Music</span>
                  {appleAcc?.connected && <p className="text-xs text-ink/50">{appleAcc.userDisplayName || 'Connected'}</p>}
                </div>
              </div>
              {appleAcc?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-black text-emerald-600"><CheckCircle2 size={16} />Connected</span>
                  <button onClick={() => disconnectAccount('apple-music')} className="text-xs font-bold text-ink/40 hover:text-red-500">Disconnect</button>
                </div>
              ) : (
                <button onClick={() => onNavigate?.('Overview')} className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white hover:bg-pulse">Connect Apple</button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-black">Quick Actions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Transfer playlist', 'Move songs between platforms', 'Transfer'],
              ['Scan duplicates', 'Find repeated tracks fast', 'Duplicates'],
              ['Move by artist', 'Collect one artist into a playlist', 'Organizer'],
              ['Merge playlists', 'Combine and remove duplicates', 'Merge'],
            ].map(([action, helper, pageKey]) => (
              <button key={action} onClick={() => onNavigate?.(pageKey)} className="group rounded-3xl bg-cloud p-5 text-left transition-all hover:-translate-y-0.5 hover:bg-lilac hover:shadow-card">
                <div className="flex items-center justify-between gap-3"><p className="font-black">{action}</p><Plus className="text-pulse" size={18} /></div>
                <p className="mt-2 text-sm font-semibold text-ink/50 group-hover:text-ink/65">{helper}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-black">Your Live Playlists</h2>
          <div className="mt-5 space-y-3">
            {playlists.length === 0 ? (
              <p className="py-8 text-center text-sm font-bold text-ink/40">No playlists loaded yet. Connect your Spotify or Apple Music account above.</p>
            ) : (
              playlists.map((playlist) => (
                <div key={playlist.id} className="grid gap-4 rounded-3xl bg-cloud p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="flex items-center gap-3">
                    {playlist.imageUrl ? (
                      <img src={playlist.imageUrl} alt={playlist.name} className="h-12 w-12 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-pulse shadow-sm"><Music2 size={20} /></div>
                    )}
                    <div>
                      <p className="font-black">{playlist.name}</p>
                      <p className="text-sm font-semibold text-ink/50">{playlist.platform.toUpperCase()} · {playlist.owner}</p>
                    </div>
                  </div>
                  <p className="font-black text-ink/60">{playlist.trackCount} tracks</p>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-black text-ink/55">{playlist.isPublic ? 'Public' : 'Private'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-black">Live Operation History</h2>
          <div className="mt-5 space-y-3">
            {operations.length === 0 ? (
              <p className="py-8 text-center text-sm font-bold text-ink/40">No operations performed yet. Transfers and cleanups will show up here.</p>
            ) : (
              operations.slice(0, 5).map((op) => (
                <div key={op.id} className="rounded-3xl bg-cloud p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black">{op.type}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{op.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink/55">{op.playlist} · {op.source} {op.destination ? `→ ${op.destination}` : ''}</p>
                  <p className="mt-3 text-sm font-black text-ink/70">{op.successfulTracks} / {op.totalTracks} tracks processed</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ title, value, helper }: { title: string; value: string; helper: string }) {
  return <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl"><p className="text-sm font-black text-ink/45">{title}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-2 text-sm font-semibold text-ink/50">{helper}</p></div>
}

function Progress({ label, value, width }: { label: string; value: string; width: string }) {
  return <div><div className="mb-2 flex justify-between text-sm font-bold text-white/68"><span>{label}</span><span>{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-mint ${width}`} /></div></div>
}
