import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, CheckCircle2, CircleDot, Loader2, XCircle } from 'lucide-react'
import { playlists, unmatchedTracks, type Platform } from '../data/mock'

export function TransferPage() {
  const [sourcePlatform, setSourcePlatform] = useState<Platform>('Spotify')
  const [destinationPlatform, setDestinationPlatform] = useState<Platform>('Apple Music')
  const [sourcePlaylistId, setSourcePlaylistId] = useState('1')
  const [destinationPlaylistId, setDestinationPlaylistId] = useState('new')
  const [analyzed, setAnalyzed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const sourcePlaylists = playlists.filter((playlist) => playlist.platform === sourcePlatform)
  const destinationPlaylists = playlists.filter((playlist) => playlist.platform === destinationPlatform)
  const sourcePlaylist = useMemo(() => playlists.find((playlist) => playlist.id === sourcePlaylistId) ?? sourcePlaylists[0], [sourcePlaylistId, sourcePlaylists])
  const matched = Math.max((sourcePlaylist?.tracks ?? 0) - 8, 0)

  function updateSourcePlatform(platform: Platform) {
    const next = playlists.find((playlist) => playlist.platform === platform)
    setSourcePlatform(platform)
    setSourcePlaylistId(next?.id ?? '')
    setAnalyzed(false)
    setConfirmed(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transfer Music" description="A guided transfer flow for beginners: choose source, choose destination, analyze, review, then confirm." />
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3 rounded-3xl bg-lilac p-4"><CircleDot className="text-pulse" size={20} /><div><p className="font-black">Step 1 of 3</p><p className="text-sm font-semibold text-ink/55">Choose where the playlist comes from and where it should go.</p></div></div>
          <div className="grid gap-5">
            <SelectBlock label="From" platform={sourcePlatform} playlistId={sourcePlaylistId} playlists={sourcePlaylists} helper="The playlist you want to copy." onPlatformChange={updateSourcePlatform} onPlaylistChange={(id) => { setSourcePlaylistId(id); setAnalyzed(false); setConfirmed(false) }} />
            <div className="flex justify-center"><div className="rounded-full bg-ink p-3 text-white shadow-card"><ArrowDown size={20} /></div></div>
            <SelectBlock label="To" platform={destinationPlatform} playlistId={destinationPlaylistId} playlists={destinationPlaylists} helper="Pick an existing playlist or create a new one." onPlatformChange={(platform) => { setDestinationPlatform(platform); setDestinationPlaylistId('new'); setConfirmed(false) }} onPlaylistChange={(id) => { setDestinationPlaylistId(id); setConfirmed(false) }} includeCreate />
            <button onClick={() => { setAnalyzed(true); setConfirmed(false) }} className="rounded-full bg-pulse px-6 py-4 font-black text-white shadow-card hover:-translate-y-0.5">Analyze Playlist</button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-2xl font-black tracking-tight">Review before transfer</h2><p className="mt-1 text-sm font-semibold text-ink/50">{analyzed ? `Sounmix found ${sourcePlaylist?.tracks ?? 0} tracks in “${sourcePlaylist?.name ?? 'Playlist'}”.` : 'Run analysis to preview matched and missing tracks.'}</p></div><span className="flex w-fit items-center gap-2 rounded-full bg-lilac px-3 py-1 text-sm font-black text-pulse"><Loader2 size={15} />{confirmed ? 'Queued' : analyzed ? 'Ready' : 'Waiting'}</span></div>
          <div className="mt-6 rounded-[1.5rem] bg-ink p-5 text-white"><div className="mb-3 flex justify-between text-sm font-bold text-white/65"><span>Matching progress</span><span>{analyzed ? '100%' : '0%'}</span></div><div className="h-3 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-mint ${analyzed ? 'w-full' : 'w-0'}`} /></div><p className="mt-3 text-sm font-semibold text-white/55">{analyzed ? `${matched} / ${sourcePlaylist?.tracks ?? 0} tracks ready` : 'Analysis has not started yet'}</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><StatusCard icon={<CheckCircle2 />} label="Ready" value={analyzed ? String(matched) : '0'} helper="Can transfer" tone="text-emerald-700 bg-emerald-50" /><StatusCard icon={<AlertTriangle />} label="Check" value={analyzed ? '5' : '0'} helper="Needs review" tone="text-amber-700 bg-amber-50" /><StatusCard icon={<XCircle />} label="Missing" value={analyzed ? '3' : '0'} helper="Not found" tone="text-rose-700 bg-rose-50" /></div>
          <div className="mt-6 rounded-3xl bg-cloud p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><p className="font-black">Could not find these tracks</p><button disabled={!analyzed} className="w-fit rounded-full bg-white px-4 py-2 text-sm font-black text-pulse disabled:opacity-40">Retry matching</button></div>{analyzed ? <ol className="mt-4 space-y-2 text-sm font-semibold text-ink/60">{unmatchedTracks.map((track, index) => <li key={track}>{String(index + 1).padStart(2, '0')}. {track}</li>)}</ol> : <p className="mt-4 text-sm font-semibold text-ink/50">No results yet.</p>}</div>
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><p className="font-black">Nothing changes yet</p><p className="mt-2 text-sm font-semibold leading-6">The transfer only starts after you confirm. Missing tracks will be skipped and shown in the result.</p></div>
          {confirmed && <div className="mt-6 rounded-3xl bg-emerald-50 p-5 font-black text-emerald-700">Transfer job queued successfully.</div>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={() => { setAnalyzed(false); setConfirmed(false) }} className="rounded-full border border-ink/10 bg-white px-6 py-3 font-black">Cancel</button><button disabled={!analyzed} className="rounded-full border border-ink/10 bg-white px-6 py-3 font-black disabled:opacity-40">Review 5 Tracks</button><button disabled={!analyzed} onClick={() => setConfirmed(true)} className="rounded-full bg-ink px-6 py-3 font-black text-white shadow-card disabled:opacity-40">Transfer {matched} Tracks</button></div>
        </div>
      </div>
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return <div><p className="font-black text-pulse">Guided flow</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">{title}</h1><p className="mt-3 max-w-2xl leading-7 text-ink/60">{description}</p></div>
}

function SelectBlock({ label, platform, playlistId, playlists: items, helper, onPlatformChange, onPlaylistChange, includeCreate }: { label: string; platform: Platform; playlistId: string; playlists: typeof playlists; helper: string; onPlatformChange: (platform: Platform) => void; onPlaylistChange: (id: string) => void; includeCreate?: boolean }) {
  return <div className="rounded-3xl bg-cloud p-5"><p className="text-sm font-black uppercase tracking-widest text-pulse">{label}</p><p className="mt-1 text-sm font-semibold text-ink/50">{helper}</p><label className="mt-4 block text-sm font-black text-ink/60">Platform</label><select value={platform} onChange={(event) => onPlatformChange(event.target.value as Platform)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm"><option>Spotify</option><option>Apple Music</option></select><label className="mt-4 block text-sm font-black text-ink/60">Playlist</label><select value={playlistId} onChange={(event) => onPlaylistChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold shadow-sm">{includeCreate && <option value="new">Create New Playlist</option>}{items.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name} · {playlist.tracks} tracks</option>)}</select></div>
}

function StatusCard({ icon, label, value, helper, tone }: { icon: React.ReactNode; label: string; value: string; helper: string; tone: string }) {
  return <div className={`rounded-3xl p-5 ${tone}`}>{icon}<p className="mt-3 text-sm font-black">{label}</p><p className="mt-1 text-3xl font-black">{value}</p><p className="mt-1 text-xs font-bold opacity-70">{helper}</p></div>
}
