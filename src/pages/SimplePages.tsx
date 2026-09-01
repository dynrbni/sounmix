import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, LockKeyhole, Music2 } from 'lucide-react'
import { artistTracks, duplicateTracks, operations, playlists } from '../data/mock'

export function SimplePages({ page }: { page: string }) {
  if (page === 'Organize') return <OrganizePage />
  if (page === 'Duplicates') return <DuplicatesPage />
  if (page === 'Merge') return <MergePage />
  if (page === 'History') return <HistoryPage />
  return <SettingsPage />
}

function OrganizePage() {
  const [source, setSource] = useState('5')
  const [artist, setArtist] = useState('The Weeknd')
  const [destination, setDestination] = useState('new-weeknd')
  const [moved, setMoved] = useState(false)
  const found = artist === 'The Weeknd' ? 17 : artist === 'Frank Ocean' ? 8 : 5

  return <Shell eyebrow="Safe move" title="Artist Organizer" description="Collect songs from one artist into a destination playlist with a beginner-friendly checklist.">
    <div className="grid gap-4 md:grid-cols-3"><PlaylistField label="Source playlist" value={source} onChange={setSource} /><Field label="Artist" value={artist} onChange={setArtist} options={['The Weeknd', 'Frank Ocean', 'M83']} /><Field label="Destination" value={destination} onChange={setDestination} options={['new-weeknd', '1', '3']} labels={{ 'new-weeknd': 'Create The Weeknd Collection', '1': 'Chill', '3': 'Favorites' }} /></div>
    <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.25fr]"><Highlight label="Found" value={`${found} tracks`} /><Safety /></div>
    <TrackList tracks={artistTracks} />
    {moved && <Success text={`${found} tracks moved safely. Operation added to history.`} />}
    <button onClick={() => setMoved(true)} className="mt-6 rounded-full bg-ink px-6 py-3 font-black text-white shadow-card">Move {found} Tracks</button>
  </Shell>
}

function DuplicatesPage() {
  const [playlistId, setPlaylistId] = useState('3')
  const [scanned, setScanned] = useState(false)
  const [selected, setSelected] = useState(['d2', 'd4'])
  const [removed, setRemoved] = useState(false)
  const playlist = playlists.find((item) => item.id === playlistId)

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    setRemoved(false)
  }

  return <Shell eyebrow="Cleanup" title="Duplicate Cleaner" description="Choose a playlist, scan duplicates, pick entries to remove, then confirm safely.">
    <div className="grid gap-4 md:grid-cols-[1fr_auto]"><PlaylistField label="Playlist to scan" value={playlistId} onChange={(value) => { setPlaylistId(value); setScanned(false); setRemoved(false) }} /><button onClick={() => setScanned(true)} className="self-end rounded-full bg-pulse px-6 py-3 font-black text-white shadow-card">Scan Duplicates</button></div>
    <div className="mt-6 rounded-3xl bg-lilac p-5"><p className="font-black text-pulse">{playlist?.name}</p><p className="mt-2 font-semibold text-ink/60">{playlist?.tracks} tracks · {scanned ? `${duplicateTracks.length} duplicate entries found` : 'Scan not started'}</p></div>
    {scanned && <div className="mt-5 grid gap-3">{duplicateTracks.map((track) => <label key={track.id} className="flex cursor-pointer items-start gap-3 rounded-3xl bg-cloud p-5"><input checked={selected.includes(track.id)} onChange={() => toggle(track.id)} type="checkbox" className="mt-1 h-5 w-5 accent-pulse" /><div><p className="font-black">{track.title} — {track.artist}</p><p className="mt-1 text-sm font-semibold text-ink/55">{track.album} · {track.duration} · Reason: ISRC match ({track.isrc})</p></div></label>)}</div>}
    <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><p className="font-black">Confirm before removing</p><p className="mt-2 text-sm font-semibold">Original library tracks will not be deleted. Only duplicate playlist entries are removed.</p></div>
    {removed && <Success text={`${selected.length} duplicate entries removed. Operation added to history.`} />}
    <button disabled={!scanned || selected.length === 0} onClick={() => setRemoved(true)} className="mt-6 rounded-full bg-rose-600 px-6 py-3 font-black text-white shadow-card disabled:opacity-40">Remove {selected.length} Duplicates</button>
  </Shell>
}

function MergePage() {
  const [first, setFirst] = useState('1')
  const [second, setSecond] = useState('2')
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const [merged, setMerged] = useState(false)
  const a = playlists.find((item) => item.id === first)
  const b = playlists.find((item) => item.id === second)
  const raw = (a?.tracks ?? 0) + (b?.tracks ?? 0)
  const duplicates = removeDuplicates ? 37 : 0

  return <Shell eyebrow="Combine" title="Merge Playlists" description="Combine two playlists into a new playlist and optionally remove duplicates before creating it.">
    <div className="grid gap-4 md:grid-cols-2"><PlaylistField label="Playlist A" value={first} onChange={setFirst} /><PlaylistField label="Playlist B" value={second} onChange={setSecond} /></div>
    <label className="mt-5 flex items-center gap-3 rounded-3xl bg-cloud p-5 font-black"><input checked={removeDuplicates} onChange={(event) => setRemoveDuplicates(event.target.checked)} type="checkbox" className="h-5 w-5 accent-pulse" />Automatically remove duplicates</label>
    <div className="mt-6 grid gap-4 md:grid-cols-3"><Highlight label="Raw total" value={`${raw}`} /><Highlight label="Duplicates" value={`${duplicates}`} /><Highlight label="Final" value={`${raw - duplicates}`} /></div>
    {merged && <Success text={`New merged playlist created with ${raw - duplicates} tracks.`} />}
    <button onClick={() => setMerged(true)} className="mt-6 rounded-full bg-ink px-6 py-3 font-black text-white shadow-card">Create Merged Playlist</button>
  </Shell>
}

function HistoryPage() {
  const [filter, setFilter] = useState('All')
  const filtered = useMemo(() => filter === 'All' ? operations : operations.filter((operation) => operation.type.includes(filter)), [filter])

  return <Shell eyebrow="Audit trail" title="Operation History" description="Every transfer, duplicate cleanup, merge, and organizer action is saved here.">
    <Field label="Filter" value={filter} onChange={setFilter} options={['All', 'Transfer', 'Duplicate', 'Organizer']} />
    <div className="mt-5 space-y-3">{filtered.map((operation) => <div key={operation.id} className="grid gap-3 rounded-3xl bg-cloud p-4 md:grid-cols-[90px_1fr_150px_130px] md:items-center"><b>{operation.date}</b><span className="font-semibold text-ink/65">{operation.route} · {operation.playlist}</span><span className="font-black">{operation.success} tracks</span><b className="w-fit rounded-full bg-white px-3 py-1 text-sm text-emerald-700">{operation.status}</b></div>)}</div>
  </Shell>
}

function SettingsPage() {
  const [spotify, setSpotify] = useState(true)
  const [apple, setApple] = useState(true)
  const [metadataDeleted, setMetadataDeleted] = useState(false)

  return <Shell eyebrow="Control center" title="Settings" description="Manage connected services, privacy controls, account data, and future billing preferences.">
    <div className="grid gap-3 md:grid-cols-2"><Action title={spotify ? 'Disconnect Spotify' : 'Connect Spotify'} onClick={() => setSpotify(!spotify)} /><Action title={apple ? 'Disconnect Apple Music' : 'Connect Apple Music'} onClick={() => setApple(!apple)} /><Action title="Delete synchronized metadata" onClick={() => setMetadataDeleted(true)} /><Action title="Delete Sounmix account" danger onClick={() => null} /></div>
    {metadataDeleted && <Success text="Synchronized metadata deleted from this frontend session." />}
  </Shell>
}

function Shell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div><p className="font-black text-pulse">{eyebrow}</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">{title}</h1><p className="mt-3 max-w-2xl leading-7 text-ink/60">{description}</p><div className="mt-6 rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">{children}</div></div>
}

function Field({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return <label className="block"><span className="text-sm font-black text-ink/50">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm">{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}</select></label>
}

function PlaylistField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-black text-ink/50">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold shadow-sm">{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name} · {playlist.platform} · {playlist.tracks} tracks</option>)}</select></label>
}

function Highlight({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl bg-lilac p-5"><p className="text-sm font-black text-pulse">{label}</p><p className="mt-2 text-4xl font-black">{value}</p></div>
}

function Safety() {
  return <div className="rounded-3xl bg-cloud p-5"><p className="flex items-center gap-2 font-black"><LockKeyhole size={18} />Safe operation</p><p className="mt-2 text-sm font-semibold leading-6 text-ink/55">Sounmix adds tracks to the destination first, verifies success, then removes them from the source.</p></div>
}

function TrackList({ tracks }: { tracks: typeof artistTracks }) {
  return <div className="mt-5 grid gap-3">{tracks.map((track) => <div key={track.id} className="rounded-3xl bg-cloud p-4"><p className="flex items-center gap-2 font-black"><Music2 size={18} />{track.title} — {track.artist}</p><p className="mt-1 text-sm font-semibold text-ink/55">{track.album} · {track.duration}</p></div>)}</div>
}

function Action({ title, danger, onClick }: { title: string; danger?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-3xl p-5 text-left font-black shadow-sm ${danger ? 'bg-rose-50 text-rose-700' : 'bg-cloud text-ink'}`}><span className="flex items-center gap-2">{danger ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}{title}</span></button>
}

function Success({ text }: { text: string }) {
  return <div className="mt-6 rounded-3xl bg-emerald-50 p-5 font-black text-emerald-700">{text}</div>
}
