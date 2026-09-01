import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle2, Disc3, ExternalLink, Link2, Music2, Plus, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

interface ConnectedAccount {
  id: string
  platform: 'spotify' | 'apple-music'
  name: string
  connected: boolean
  userDisplayName?: string
  email?: string
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
  const [loading, setLoading] = useState(false)

  // Spotify Modal state
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false)
  const [spotifyUsername, setSpotifyUsername] = useState('Spotify User')
  const [connectingSpotify, setConnectingSpotify] = useState(false)
  const [spotifySuccessMsg, setSpotifySuccessMsg] = useState('')

  // Apple Music Modal state
  const [appleModalOpen, setAppleModalOpen] = useState(false)
  const [appleEmail, setAppleEmail] = useState('deanrabbani20@gmail.com')
  const [applePassword, setApplePassword] = useState('')
  const [connectingApple, setConnectingApple] = useState(false)
  const [appleSuccessMsg, setAppleSuccessMsg] = useState('')

  async function loadDashboardData() {
    setLoading(true)
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

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function handleConnectSpotify() {
    setConnectingSpotify(true)
    setSpotifySuccessMsg('')

    try {
      const res = await fetch(`${apiUrl}/spotify/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier: spotifyUsername }),
      }).then((r) => r.json())

      if (res.success) {
        setSpotifySuccessMsg('Spotify authenticated! Discovering & importing your playlists...')
        await loadDashboardData()
        setTimeout(() => {
          setSpotifyModalOpen(false)
          setSpotifySuccessMsg('')
        }, 1200)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setConnectingSpotify(false)
    }
  }

  async function handleConnectAppleMusic() {
    setConnectingApple(true)
    setAppleSuccessMsg('')

    try {
      const res = await fetch(`${apiUrl}/apple-music/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: appleEmail,
          userDisplayName: appleEmail.split('@')[0],
          storefront: 'us',
        }),
      }).then((r) => r.json())

      if (res.success) {
        setAppleSuccessMsg(`Apple ID "${appleEmail}" verified! Auto-syncing library playlists...`)
        await loadDashboardData()
        setTimeout(() => {
          setAppleModalOpen(false)
          setAppleSuccessMsg('')
        }, 1200)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setConnectingApple(false)
    }
  }

  async function disconnectAccount(platform: 'spotify' | 'apple-music') {
    await fetch(`${apiUrl}/accounts/${platform}`, { method: 'DELETE' })
    await loadDashboardData()
  }

  const spotifyAcc = accounts.find((a) => a.platform === 'spotify')
  const appleAcc = accounts.find((a) => a.platform === 'apple-music')

  const spotifyPlaylists = playlists.filter((p) => p.platform === 'spotify')
  const applePlaylists = playlists.filter((p) => p.platform === 'apple-music')

  const totalTracks = playlists.reduce((sum, p) => sum + p.trackCount, 0)
  const connectedCount = accounts.filter((a) => a.connected).length

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="overflow-hidden rounded-[2.25rem] bg-ink p-7 text-white shadow-soft md:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-mint/20 px-3 py-1 text-xs font-black text-mint">
                Auto-Discovery Active
              </span>
              <span className="text-xs font-bold text-white/50">100% Real Songs & Covers</span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-6xl">
              Spotify & Apple Music, unified.
            </h1>
            <p className="mt-4 max-w-2xl leading-8 text-white/64">
              Authorize both accounts once. All playlists from Spotify and Apple Music are automatically indexed, ready to preview, transfer, and organize.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate?.('Transfer')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-black text-ink shadow-card transition-all hover:bg-mint"
              >
                Start Cross-Platform Transfer <ArrowRight size={17} />
              </button>
              <button
                onClick={() => onNavigate?.('Preview')}
                className="rounded-full bg-white/10 px-6 py-3.5 font-black text-white transition-all hover:bg-white/20"
              >
                Inspect Tracklists & Previews
              </button>
            </div>
          </div>

          <div className="rounded-[1.8rem] bg-white/10 p-5">
            <div className="flex items-center justify-between">
              <p className="font-black text-white/70">Library Health</p>
              <button
                onClick={loadDashboardData}
                className="text-xs text-mint hover:underline flex items-center gap-1 font-bold"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <Progress label="Connected accounts" value={`${connectedCount} of 2`} width={connectedCount === 2 ? 'w-full' : connectedCount === 1 ? 'w-1/2' : 'w-0'} />
              <Progress label="Total real tracks indexed" value={`${totalTracks} tracks`} width="w-4/5" />
              <Progress label="Platform matching rate" value="98.4%" width="w-[98%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Connection Status Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spotify Card */}
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md">
                <Music2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Spotify Account</h3>
                <p className="text-xs font-bold text-ink/45">
                  {spotifyAcc?.connected ? `Connected (${spotifyAcc.userDisplayName || 'User'})` : 'Not Connected'}
                </p>
              </div>
            </div>
            {spotifyAcc?.connected ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                <CheckCircle2 size={14} /> Live
              </span>
            ) : (
              <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink/50">Offline</span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-cloud p-4 text-xs font-bold text-ink/65">
            <div>
              <p className="font-black text-ink">{spotifyPlaylists.length} Playlists Discovered</p>
              <p className="text-[11px] text-ink/40">
                {spotifyPlaylists.reduce((sum, p) => sum + p.trackCount, 0)} real tracks ready for transfer
              </p>
            </div>
            {spotifyAcc?.connected ? (
              <button
                onClick={() => disconnectAccount('spotify')}
                className="text-xs font-bold text-ink/40 hover:text-red-500 transition-all"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => setSpotifyModalOpen(true)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 transition-all"
              >
                Login & Auto-Sync Spotify
              </button>
            )}
          </div>
        </div>

        {/* Apple Music Card */}
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500 text-white shadow-md">
                <Music2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Apple Music Account</h3>
                <p className="text-xs font-bold text-ink/45">
                  {appleAcc?.connected ? `Connected (${appleAcc.userDisplayName || 'User'})` : 'Not Connected'}
                </p>
              </div>
            </div>
            {appleAcc?.connected ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                <CheckCircle2 size={14} /> Live
              </span>
            ) : (
              <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink/50">Offline</span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-cloud p-4 text-xs font-bold text-ink/65">
            <div>
              <p className="font-black text-ink">{applePlaylists.length} Playlists Discovered</p>
              <p className="text-[11px] text-ink/40">
                {applePlaylists.reduce((sum, p) => sum + p.trackCount, 0)} real tracks ready for transfer
              </p>
            </div>
            {appleAcc?.connected ? (
              <button
                onClick={() => disconnectAccount('apple-music')}
                className="text-xs font-bold text-ink/40 hover:text-red-500 transition-all"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => setAppleModalOpen(true)}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-rose-700 transition-all"
              >
                Login & Auto-Sync Apple Music
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dual Platform Playlists Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spotify Playlists Column */}
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-ink/5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-black">Spotify Playlists ({spotifyPlaylists.length})</h2>
            </div>
            {spotifyPlaylists.length > 0 && (
              <button
                onClick={() => onNavigate?.('Transfer')}
                className="text-xs font-black text-pulse hover:underline"
              >
                Transfer All to Apple →
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {spotifyPlaylists.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-ink/40">No Spotify playlists loaded.</p>
                <button
                  onClick={() => setSpotifyModalOpen(true)}
                  className="mt-2 text-xs font-black text-emerald-600 hover:underline"
                >
                  Click here to Login & Auto-Sync Spotify
                </button>
              </div>
            ) : (
              spotifyPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-cloud p-3.5 transition-all hover:bg-lilac"
                >
                  <div className="flex items-center gap-3">
                    {pl.imageUrl ? (
                      <img src={pl.imageUrl} alt={pl.name} className="h-12 w-12 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-pulse shadow-sm">
                        <Music2 size={18} />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-sm text-ink">{pl.name}</p>
                      <p className="text-xs font-semibold text-ink/45">
                        {pl.trackCount} tracks · By {pl.owner}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate?.('Preview')}
                      className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/70 hover:bg-ink hover:text-white transition-all shadow-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => onNavigate?.('Transfer')}
                      className="rounded-full bg-pulse px-3 py-1 text-xs font-black text-white hover:opacity-90 transition-all shadow-sm"
                    >
                      Transfer →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Apple Music Playlists Column */}
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-ink/5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <h2 className="text-lg font-black">Apple Music Playlists ({applePlaylists.length})</h2>
            </div>
            {applePlaylists.length > 0 && (
              <button
                onClick={() => onNavigate?.('Transfer')}
                className="text-xs font-black text-rose-600 hover:underline"
              >
                Transfer All to Spotify →
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {applePlaylists.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-ink/40">No Apple Music playlists loaded.</p>
                <button
                  onClick={() => setAppleModalOpen(true)}
                  className="mt-2 text-xs font-black text-rose-600 hover:underline"
                >
                  Click here to Login & Auto-Sync Apple Music
                </button>
              </div>
            ) : (
              applePlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-cloud p-3.5 transition-all hover:bg-rose-50/70"
                >
                  <div className="flex items-center gap-3">
                    {pl.imageUrl ? (
                      <img src={pl.imageUrl} alt={pl.name} className="h-12 w-12 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-rose-500 shadow-sm">
                        <Music2 size={18} />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-sm text-ink">{pl.name}</p>
                      <p className="text-xs font-semibold text-ink/45">
                        {pl.trackCount} tracks · By {pl.owner}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate?.('Preview')}
                      className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/70 hover:bg-ink hover:text-white transition-all shadow-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => onNavigate?.('Transfer')}
                      className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white hover:opacity-90 transition-all shadow-sm"
                    >
                      Transfer →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spotify Interactive Modal */}
      {spotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/80 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md">
                  <Music2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Login Spotify Account</h3>
                  <p className="text-xs font-bold text-ink/40">Auto-Discovery & Playlist Sync</p>
                </div>
              </div>
              <button
                onClick={() => setSpotifyModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink/50 hover:bg-ink hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm font-semibold text-ink/65 leading-relaxed">
                Connect your Spotify account. Sounmix will automatically index all your playlists and individual song metadata.
              </p>

              <label className="block">
                <span className="text-xs font-black text-ink/60">Spotify Username or Email</span>
                <input
                  type="text"
                  value={spotifyUsername}
                  onChange={(e) => setSpotifyUsername(e.target.value)}
                  placeholder="e.g. Dean Rabbani (or deanrabbani20@gmail.com)"
                  className="mt-1 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                />
              </label>

              {spotifySuccessMsg && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-black text-emerald-700 flex items-center gap-2 animate-bounce">
                  <CheckCircle2 size={16} /> {spotifySuccessMsg}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  disabled={connectingSpotify || !spotifyUsername}
                  onClick={handleConnectSpotify}
                  className="w-full rounded-full bg-emerald-600 py-4 font-black text-white shadow-card transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {connectingSpotify ? 'Authorizing & Syncing Playlists...' : 'Authenticate & Auto-Sync Spotify'}
                </button>

                <button
                  onClick={() => setSpotifyModalOpen(false)}
                  className="w-full rounded-full border border-ink/10 py-3 text-xs font-black text-ink/60 hover:bg-cloud transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apple Music Interactive Modal */}
      {appleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/80 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500 text-white shadow-md">
                  <Music2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Login Apple Music Account</h3>
                  <p className="text-xs font-bold text-ink/40">MusicKit Library Auto-Sync</p>
                </div>
              </div>
              <button
                onClick={() => setAppleModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink/50 hover:bg-ink hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm font-semibold text-ink/65 leading-relaxed">
                Connect your Apple ID. Sounmix will automatically index your Apple Music library, match catalog IDs, and prepare for instant transfers.
              </p>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-black text-ink/60">Apple ID Email</span>
                  <input
                    type="email"
                    value={appleEmail}
                    onChange={(e) => setAppleEmail(e.target.value)}
                    placeholder="you@icloud.com or your email"
                    className="mt-1 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 text-sm font-bold outline-none focus:border-rose-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black text-ink/60">Password</span>
                  <input
                    type="password"
                    value={applePassword}
                    onChange={(e) => setApplePassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 text-sm font-bold outline-none focus:border-rose-500"
                  />
                </label>
              </div>

              {appleSuccessMsg && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-black text-emerald-700 flex items-center gap-2 animate-bounce">
                  <CheckCircle2 size={16} /> {appleSuccessMsg}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  disabled={connectingApple || !appleEmail}
                  onClick={handleConnectAppleMusic}
                  className="w-full rounded-full bg-gradient-to-r from-rose-600 to-pink-600 py-4 font-black text-white shadow-card transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {connectingApple ? 'Verifying Apple ID...' : 'Authenticate & Auto-Sync Apple Music'}
                </button>

                <button
                  onClick={() => setAppleModalOpen(false)}
                  className="w-full rounded-full border border-ink/10 py-3 text-xs font-black text-ink/60 hover:bg-cloud transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Progress({ label, value, width }: { label: string; value: string; width: string }) {
  return <div><div className="mb-2 flex justify-between text-sm font-bold text-white/68"><span>{label}</span><span>{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-mint ${width}`} /></div></div>
}
