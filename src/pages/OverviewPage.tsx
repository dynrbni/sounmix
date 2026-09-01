import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle2, Disc3, ExternalLink, KeyRound, Link2, Lock, Music2, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2, UserCheck, X } from 'lucide-react'

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

  // Direct add custom playlist state
  const [customSpotifyUrl, setCustomSpotifyUrl] = useState('')
  const [addingSpotify, setAddingSpotify] = useState(false)
  const [customAppleUrl, setCustomAppleUrl] = useState('')
  const [addingApple, setAddingApple] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  // Spotify OAuth & Token Login Modal
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false)
  const [spotifyTab, setSpotifyTab] = useState<'oauth' | 'token' | 'username'>('token')
  const [spotifyToken, setSpotifyToken] = useState('')
  const [spotifyUsername, setSpotifyUsername] = useState('Spotify User')
  const [connectingSpotify, setConnectingSpotify] = useState(false)
  const [spotifyMsg, setSpotifyMsg] = useState('')

  // Apple Music OAuth Modal
  const [appleModalOpen, setAppleModalOpen] = useState(false)
  const [appleTab, setAppleTab] = useState<'appleId' | 'token'>('appleId')
  const [appleEmail, setAppleEmail] = useState('deanrabbani20@gmail.com')
  const [applePassword, setApplePassword] = useState('')
  const [appleToken, setAppleToken] = useState('')
  const [connectingApple, setConnectingApple] = useState(false)
  const [appleMsg, setAppleMsg] = useState('')

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

  function connectSpotifyOfficialOAuth() {
    window.location.href = `${apiUrl}/spotify/login`
  }

  async function handleSpotifyTokenLogin() {
    if (!spotifyToken.trim()) return
    setConnectingSpotify(true)
    setSpotifyMsg('')
    try {
      const res = await fetch(`${apiUrl}/spotify/token-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: spotifyToken.trim() }),
      }).then((r) => r.json())

      if (res.success) {
        setSpotifyMsg(res.data.message)
        setSpotifyToken('')
        await loadDashboardData()
        setTimeout(() => {
          setSpotifyModalOpen(false)
          setSpotifyMsg('')
        }, 1500)
      } else {
        setSpotifyMsg(res.error?.message || 'Token login failed.')
      }
    } catch {
      setSpotifyMsg('Could not connect to backend.')
    } finally {
      setConnectingSpotify(false)
    }
  }

  async function handleSpotifyUsernameSync() {
    setConnectingSpotify(true)
    setSpotifyMsg('')
    try {
      const res = await fetch(`${apiUrl}/spotify/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdentifier: spotifyUsername }),
      }).then((r) => r.json())

      if (res.success) {
        setSpotifyMsg('Account linked successfully!')
        await loadDashboardData()
        setTimeout(() => {
          setSpotifyModalOpen(false)
          setSpotifyMsg('')
        }, 1200)
      }
    } catch {
      setSpotifyMsg('Error connecting.')
    } finally {
      setConnectingSpotify(false)
    }
  }

  async function handleAppleMusicOAuthLogin() {
    setConnectingApple(true)
    setAppleMsg('')
    try {
      const res = await fetch(`${apiUrl}/apple-music/oauth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: appleEmail,
          password: applePassword,
          musicUserToken: appleToken || undefined,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setAppleMsg(res.data.message)
        await loadDashboardData()
        setTimeout(() => {
          setAppleModalOpen(false)
          setAppleMsg('')
        }, 1500)
      } else {
        setAppleMsg(res.error?.message || 'Apple authentication failed.')
      }
    } catch {
      setAppleMsg('Error connecting.')
    } finally {
      setConnectingApple(false)
    }
  }

  async function handleAddCustomSpotify() {
    if (!customSpotifyUrl.trim()) return
    setAddingSpotify(true)
    setActionMsg('')
    try {
      const res = await fetch(`${apiUrl}/playlists/import-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customSpotifyUrl.trim() }),
      }).then((r) => r.json())

      if (res.success) {
        setActionMsg(`Successfully added "${res.data.playlist.name}" (${res.data.trackCount} tracks)!`)
        setCustomSpotifyUrl('')
        await loadDashboardData()
      } else {
        setActionMsg(res.error?.message || 'Could not import Spotify playlist. Check link.')
      }
    } catch {
      setActionMsg('Error connecting to server.')
    } finally {
      setAddingSpotify(false)
    }
  }

  async function handleAddCustomApple() {
    if (!customAppleUrl.trim()) return
    setAddingApple(true)
    setActionMsg('')
    try {
      const res = await fetch(`${apiUrl}/playlists/import-apple-music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customAppleUrl.trim() }),
      }).then((r) => r.json())

      if (res.success) {
        setActionMsg(`Successfully added "${res.data.playlist.name}" (${res.data.trackCount} tracks)!`)
        setCustomAppleUrl('')
        await loadDashboardData()
      } else {
        setActionMsg(res.error?.message || 'Could not import Apple Music playlist. Check link.')
      }
    } catch {
      setActionMsg('Error connecting to server.')
    } finally {
      setAddingApple(false)
    }
  }

  async function handleDeletePlaylist(id: string) {
    try {
      await fetch(`${apiUrl}/playlists/${id}`, { method: 'DELETE' })
      await loadDashboardData()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleClearAllPlaylists() {
    if (confirm('Clear all loaded playlists to start fresh with only your personal playlists?')) {
      await fetch(`${apiUrl}/playlists/clear/all`, { method: 'DELETE' })
      await loadDashboardData()
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
                OAuth & Personal Playlists
              </span>
              <span className="text-xs font-bold text-white/50">Spotify & Apple Music</span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-6xl">
              Your real music library.
            </h1>
            <p className="mt-4 max-w-2xl leading-8 text-white/64">
              Authenticate your Spotify and Apple Music accounts to automatically discover and transfer your personal playlists with authentic track metadata and original artwork.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate?.('Transfer')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-black text-ink shadow-card transition-all hover:bg-mint"
              >
                Transfer Playlist <ArrowRight size={17} />
              </button>
              <button
                onClick={() => onNavigate?.('Preview')}
                className="rounded-full bg-white/10 px-6 py-3.5 font-black text-white transition-all hover:bg-white/20"
              >
                Inspect Songs & Previews
              </button>
              {playlists.length > 0 && (
                <button
                  onClick={handleClearAllPlaylists}
                  className="rounded-full bg-white/5 px-4 py-3.5 text-xs font-bold text-white/60 hover:bg-rose-950/40 hover:text-rose-300 transition-all"
                >
                  Clear All List
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[1.8rem] bg-white/10 p-5">
            <div className="flex items-center justify-between">
              <p className="font-black text-white/70">Library Summary</p>
              <button
                onClick={loadDashboardData}
                className="text-xs text-mint hover:underline flex items-center gap-1 font-bold"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <Progress label="Spotify playlists" value={`${spotifyPlaylists.length} playlists`} width="w-3/4" />
              <Progress label="Apple Music playlists" value={`${applePlaylists.length} playlists`} width="w-2/3" />
              <Progress label="Total real tracks" value={`${totalTracks} songs`} width="w-4/5" />
            </div>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-black text-emerald-800 flex items-center justify-between shadow-sm">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-900 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Dual Column: Spotify & Apple Music Personal Playlists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spotify Personal Column */}
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-ink/5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm">
                <Music2 size={16} />
              </div>
              <div>
                <h2 className="text-lg font-black">Spotify Playlists ({spotifyPlaylists.length})</h2>
                <p className="text-[11px] font-semibold text-ink/45">
                  {spotifyAcc?.connected ? `Connected (${spotifyAcc.userDisplayName || 'User'})` : 'Login to auto-fetch all playlists'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSpotifyModalOpen(true)}
              className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Lock size={12} /> Spotify OAuth / Login
            </button>
          </div>

          {/* Add Custom Spotify Playlist Bar */}
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs font-black text-ink/60">Add Your Personal Spotify Playlist</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3.5 top-2.5 text-ink/40" size={15} />
                <input
                  type="text"
                  value={customSpotifyUrl}
                  onChange={(e) => setCustomSpotifyUrl(e.target.value)}
                  placeholder="Paste your Spotify playlist link here..."
                  className="w-full rounded-xl border border-ink/10 bg-cloud pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <button
                disabled={addingSpotify || !customSpotifyUrl.trim()}
                onClick={handleAddCustomSpotify}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 transition-all"
              >
                {addingSpotify ? 'Adding...' : '+ Add'}
              </button>
            </div>
          </div>

          {/* Spotify Playlists List */}
          <div className="mt-4 space-y-3">
            {spotifyPlaylists.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-cloud/50 p-4">
                <p className="text-sm font-bold text-ink/40">No Spotify playlists in your list yet.</p>
                <p className="mt-1 text-xs text-ink/30">Click "Spotify OAuth / Login" or paste any playlist link above!</p>
              </div>
            ) : (
              spotifyPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-cloud p-3.5 transition-all hover:bg-lilac"
                >
                  <div className="flex items-center gap-3">
                    {pl.imageUrl ? (
                      <img src={pl.imageUrl} alt={pl.name} className="h-12 w-12 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
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
                      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      Transfer →
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(pl.id)}
                      title="Remove from list"
                      className="rounded-full p-1.5 text-ink/30 hover:bg-rose-100 hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Apple Music Personal Column */}
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-ink/5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500 text-white shadow-sm">
                <Music2 size={16} />
              </div>
              <div>
                <h2 className="text-lg font-black">Apple Music Playlists ({applePlaylists.length})</h2>
                <p className="text-[11px] font-semibold text-ink/45">
                  {appleAcc?.connected ? `Connected (${appleAcc.userDisplayName || 'User'})` : 'Login to auto-fetch all playlists'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setAppleModalOpen(true)}
              className="rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-rose-700 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Lock size={12} /> Apple Music OAuth / Login
            </button>
          </div>

          {/* Add Custom Apple Music Playlist Bar */}
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs font-black text-ink/60">Add Your Personal Apple Music Playlist</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3.5 top-2.5 text-ink/40" size={15} />
                <input
                  type="text"
                  value={customAppleUrl}
                  onChange={(e) => setCustomAppleUrl(e.target.value)}
                  placeholder="Paste your Apple Music playlist link here..."
                  className="w-full rounded-xl border border-ink/10 bg-cloud pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-rose-500"
                />
              </div>
              <button
                disabled={addingApple || !customAppleUrl.trim()}
                onClick={handleAddCustomApple}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-rose-700 disabled:opacity-40 transition-all"
              >
                {addingApple ? 'Adding...' : '+ Add'}
              </button>
            </div>
          </div>

          {/* Apple Music Playlists List */}
          <div className="mt-4 space-y-3">
            {applePlaylists.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-cloud/50 p-4">
                <p className="text-sm font-bold text-ink/40">No Apple Music playlists in your list yet.</p>
                <p className="mt-1 text-xs text-ink/30">Click "Apple Music OAuth / Login" or paste any playlist link above!</p>
              </div>
            ) : (
              applePlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-cloud p-3.5 transition-all hover:bg-rose-50/70"
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
                      className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white hover:bg-rose-700 transition-all shadow-sm"
                    >
                      Transfer →
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(pl.id)}
                      title="Remove from list"
                      className="rounded-full p-1.5 text-ink/30 hover:bg-rose-100 hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spotify Multi-Method OAuth / Token Modal */}
      {spotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-white/80 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md">
                  <Music2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Spotify Authentication</h3>
                  <p className="text-xs font-bold text-ink/40">Auto-load all personal playlists</p>
                </div>
              </div>
              <button
                onClick={() => setSpotifyModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink/50 hover:bg-ink hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex rounded-2xl bg-cloud p-1 text-xs font-black">
              <button
                onClick={() => setSpotifyTab('token')}
                className={`flex-1 rounded-xl py-2 transition-all ${spotifyTab === 'token' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'}`}
              >
                Web Token (Zero App Needed)
              </button>
              <button
                onClick={() => setSpotifyTab('oauth')}
                className={`flex-1 rounded-xl py-2 transition-all ${spotifyTab === 'oauth' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'}`}
              >
                Official OAuth
              </button>
              <button
                onClick={() => setSpotifyTab('username')}
                className={`flex-1 rounded-xl py-2 transition-all ${spotifyTab === 'username' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'}`}
              >
                User ID Sync
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {spotifyTab === 'token' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-ink/65 leading-relaxed">
                    Paste your Spotify Web Access Token (from <code className="bg-cloud px-1.5 py-0.5 rounded font-mono text-[11px]">open.spotify.com</code> DevTools $\rightarrow$ Bearer Token) to pull <strong>all your private & public personal playlists</strong> instantly without developer approval!
                  </p>
                  <textarea
                    rows={3}
                    value={spotifyToken}
                    onChange={(e) => setSpotifyToken(e.target.value)}
                    placeholder="Paste Spotify Bearer Token (e.g. BQ...)..."
                    className="w-full rounded-2xl border border-ink/10 bg-cloud p-3 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                  />
                  <button
                    disabled={connectingSpotify || !spotifyToken.trim()}
                    onClick={handleSpotifyTokenLogin}
                    className="w-full rounded-full bg-emerald-600 py-3.5 font-black text-white shadow-card hover:bg-emerald-700 disabled:opacity-50 transition-all text-xs"
                  >
                    {connectingSpotify ? 'Fetching Playlists from Spotify...' : 'Authenticate & Load All Playlists'}
                  </button>
                </div>
              )}

              {spotifyTab === 'oauth' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-ink/65 leading-relaxed">
                    Redirects to official Spotify Web authorization page.
                  </p>
                  <button
                    onClick={connectSpotifyOfficialOAuth}
                    className="w-full rounded-full bg-ink py-3.5 font-black text-white shadow-card hover:bg-emerald-600 transition-all text-xs flex items-center justify-center gap-2"
                  >
                    Launch Spotify OAuth Sign-In <ExternalLink size={14} />
                  </button>
                </div>
              )}

              {spotifyTab === 'username' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-ink/65 leading-relaxed">
                    Enter your Spotify username or email to link your account.
                  </p>
                  <input
                    type="text"
                    value={spotifyUsername}
                    onChange={(e) => setSpotifyUsername(e.target.value)}
                    placeholder="e.g. Dean Rabbani"
                    className="w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                  <button
                    disabled={connectingSpotify || !spotifyUsername.trim()}
                    onClick={handleSpotifyUsernameSync}
                    className="w-full rounded-full bg-emerald-600 py-3.5 font-black text-white shadow-card hover:bg-emerald-700 disabled:opacity-50 transition-all text-xs"
                  >
                    {connectingSpotify ? 'Linking...' : 'Link Spotify Account'}
                  </button>
                </div>
              )}

              {spotifyMsg && (
                <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-black text-emerald-700 animate-bounce">
                  {spotifyMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apple Music OAuth Modal */}
      {appleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-white/80 bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500 text-white shadow-md">
                  <Music2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Apple Music Authentication</h3>
                  <p className="text-xs font-bold text-ink/40">Apple ID & MusicKit Library OAuth</p>
                </div>
              </div>
              <button
                onClick={() => setAppleModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink/50 hover:bg-ink hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex rounded-2xl bg-cloud p-1 text-xs font-black">
              <button
                onClick={() => setAppleTab('appleId')}
                className={`flex-1 rounded-xl py-2 transition-all ${appleTab === 'appleId' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'}`}
              >
                Sign in with Apple ID
              </button>
              <button
                onClick={() => setAppleTab('token')}
                className={`flex-1 rounded-xl py-2 transition-all ${appleTab === 'token' ? 'bg-white text-ink shadow-sm' : 'text-ink/50'}`}
              >
                Music User Token
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {appleTab === 'appleId' && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-black text-ink/60">Apple ID Email</span>
                    <input
                      type="email"
                      value={appleEmail}
                      onChange={(e) => setAppleEmail(e.target.value)}
                      placeholder="you@icloud.com"
                      className="mt-1 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 text-xs font-bold outline-none focus:border-rose-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-black text-ink/60">Password</span>
                    <input
                      type="password"
                      value={applePassword}
                      onChange={(e) => setApplePassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 text-xs font-bold outline-none focus:border-rose-500"
                    />
                  </label>
                  <button
                    disabled={connectingApple || !appleEmail}
                    onClick={handleAppleMusicOAuthLogin}
                    className="w-full rounded-full bg-rose-600 py-3.5 font-black text-white shadow-card hover:bg-rose-700 disabled:opacity-50 transition-all text-xs"
                  >
                    {connectingApple ? 'Authenticating Apple ID...' : 'Authorize Apple ID & Connect Library'}
                  </button>
                </div>
              )}

              {appleTab === 'token' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-ink/65 leading-relaxed">
                    Enter your Apple MusicKit User Token to access personal playlists directly.
                  </p>
                  <textarea
                    rows={3}
                    value={appleToken}
                    onChange={(e) => setAppleToken(e.target.value)}
                    placeholder="Paste Music-User-Token..."
                    className="w-full rounded-2xl border border-ink/10 bg-cloud p-3 text-xs font-mono font-bold outline-none focus:border-rose-500"
                  />
                  <button
                    disabled={connectingApple}
                    onClick={handleAppleMusicOAuthLogin}
                    className="w-full rounded-full bg-rose-600 py-3.5 font-black text-white shadow-card hover:bg-rose-700 disabled:opacity-50 transition-all text-xs"
                  >
                    {connectingApple ? 'Connecting...' : 'Authorize Music User Token'}
                  </button>
                </div>
              )}

              {appleMsg && (
                <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-black text-emerald-700 animate-bounce">
                  {appleMsg}
                </div>
              )}
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
