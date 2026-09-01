import { ArrowRight, CheckCircle2, Music2, Plus, ShieldCheck } from 'lucide-react'
import { operations, playlists } from '../data/mock'

export function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2.25rem] bg-ink p-7 text-white shadow-soft md:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="font-black text-mint">Welcome back</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-6xl">Your music dashboard, made simple.</h1>
            <p className="mt-4 max-w-2xl leading-8 text-white/64">Start with one action: transfer a playlist, clean duplicates, or organize songs by artist.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-ink">Start transfer <ArrowRight size={17} /></button>
              <button className="rounded-full bg-white/10 px-5 py-3 font-black text-white">Scan duplicates</button>
            </div>
          </div>
          <div className="rounded-[1.8rem] bg-white/10 p-5">
            <p className="font-black text-white/70">Library health</p>
            <div className="mt-5 space-y-4">
              <Progress label="Matched tracks" value="96%" width="w-[96%]" />
              <Progress label="Duplicate risk" value="Low" width="w-[18%]" />
              <Progress label="Connected services" value="2/2" width="w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Stat title="Connected" value="2 services" helper="Spotify and Apple Music ready" />
        <Stat title="Playlists" value="3 synced" helper="Ready for transfer and cleanup" />
        <Stat title="Recent success" value="239 tracks" helper="Transferred from Chill" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-xl font-black">Connected Services</h2><p className="mt-1 text-sm font-semibold text-ink/50">Connect once, manage from here.</p></div>
            <ShieldCheck className="text-pulse" />
          </div>
          <div className="mt-5 grid gap-3">
            <Service name="Spotify" status="Connected" color="bg-emerald-400" />
            <Service name="Apple Music" status="Connected" color="bg-coral" />
          </div>
          <div className="mt-6 rounded-3xl bg-lilac p-5">
            <p className="font-black text-pulse">Recommended next step</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">Try transferring “Chill” to Apple Music and review matches before confirming.</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-black">Quick Actions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Transfer playlist', 'Move songs between platforms'],
              ['Scan duplicates', 'Find repeated tracks fast'],
              ['Move by artist', 'Collect one artist into a playlist'],
              ['Merge playlists', 'Combine and remove duplicates'],
            ].map(([action, helper]) => (
              <button key={action} className="group rounded-3xl bg-cloud p-5 text-left hover:-translate-y-0.5 hover:bg-lilac hover:shadow-card">
                <div className="flex items-center justify-between gap-3"><p className="font-black">{action}</p><Plus className="text-pulse" size={18} /></div>
                <p className="mt-2 text-sm font-semibold text-ink/50 group-hover:text-ink/65">{helper}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-black">Your Playlists</h2>
          <div className="mt-5 space-y-3">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="grid gap-4 rounded-3xl bg-cloud p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-pulse shadow-sm"><Music2 size={20} /></div>
                  <div><p className="font-black">{playlist.name}</p><p className="text-sm font-semibold text-ink/50">{playlist.platform} · {playlist.owner}</p></div>
                </div>
                <p className="font-black text-ink/60">{playlist.tracks} tracks</p>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-black text-ink/55">{playlist.visibility}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-black">Recent Activity</h2>
          <div className="mt-5 space-y-3">
            {operations.slice(0, 3).map((operation) => (
              <div key={operation.id} className="rounded-3xl bg-cloud p-4">
                <div className="flex items-start justify-between gap-3"><p className="font-black">{operation.type}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{operation.status}</span></div>
                <p className="mt-1 text-sm font-semibold text-ink/55">{operation.playlist} · {operation.route}</p>
                <p className="mt-3 text-sm font-black text-ink/70">{operation.success} / {operation.total} tracks</p>
              </div>
            ))}
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

function Service({ name, status, color }: { name: string; status: string; color: string }) {
  return <div className="flex items-center justify-between rounded-3xl bg-cloud p-4"><div className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${color}`} /><span className="font-black">{name}</span></div><span className="flex items-center gap-2 text-sm font-black text-emerald-700"><CheckCircle2 size={16} />{status}</span></div>
}
