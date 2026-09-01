import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, Music2, Shield, Sparkles } from 'lucide-react'

type LandingProps = {
  onGetStarted: () => void
}

const steps = [
  ['1', 'Connect your accounts', 'Sign in once, then connect Spotify and Apple Music securely.'],
  ['2', 'Choose what to fix', 'Transfer, remove duplicates, organize by artist, or merge playlists.'],
  ['3', 'Review before changes', 'See exactly what will happen before Sounmix touches a playlist.'],
]

const features = ['Playlist transfer', 'Duplicate cleaner', 'Artist organizer', 'Merge playlists']

export function LandingPage({ onGetStarted }: LandingProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-aura text-ink">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <button onClick={onGetStarted} className="flex items-center gap-3 rounded-full bg-white/75 px-4 py-2 font-black shadow-sm backdrop-blur">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white"><Music2 size={18} /></span>
          Sounmix
        </button>
        <div className="hidden items-center gap-7 rounded-full bg-white/70 px-6 py-3 text-sm font-bold text-ink/60 shadow-sm backdrop-blur md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#security" className="hover:text-ink">Security</a>
        </div>
        <button onClick={onGetStarted} className="rounded-full bg-white px-5 py-3 text-sm font-black text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-card">
          Open app
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-[1fr_0.92fr] lg:pb-24 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-black text-pulse shadow-sm backdrop-blur">
            <Sparkles size={16} /> Simple playlist management for everyone
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] md:text-7xl">
            Move, clean, and organize your music without the headache.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/62">
            Sounmix helps regular Spotify and Apple Music users transfer playlists, find duplicates, and preview changes with a clear step-by-step flow.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={onGetStarted} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 font-black text-white shadow-soft hover:-translate-y-0.5">
              Get Started <ArrowRight size={18} />
            </button>
            <a href="#how" className="rounded-full border border-ink/10 bg-white/80 px-7 py-4 text-center font-black text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-card">
              Learn in 30 seconds
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-ink/60">
            {['No confusing setup', 'Preview before action', 'Safe playlist edits'].map((item) => (
              <span key={item} className="rounded-full bg-white/70 px-4 py-2 shadow-sm">{item}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-mint/40 blur-3xl" />
          <div className="absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-grape/40 blur-3xl" />
          <div className="relative rounded-[2.25rem] border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl">
            <div className="rounded-[1.8rem] bg-ink p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/50">Today’s plan</p>
                  <h2 className="text-2xl font-black">Transfer Chill</h2>
                </div>
                <span className="rounded-full bg-mint/20 px-3 py-1 text-sm font-black text-sky-100">Safe preview</span>
              </div>
              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Platform name="Spotify" tone="bg-emerald-400" />
                <ArrowRight size={22} className="text-white/40" />
                <Platform name="Apple Music" tone="bg-coral" />
              </div>
              <div className="mt-6 rounded-[1.5rem] bg-white p-4 text-ink">
                <div className="mb-4 flex items-center justify-between">
                  <b>Analyzing tracks</b>
                  <b className="text-pulse">68%</b>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-lilac"><div className="h-full w-[68%] rounded-full bg-pulse" /></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="Matched" value="239" tone="bg-emerald-50 text-emerald-700" />
                  <Metric label="Review" value="5" tone="bg-amber-50 text-amber-700" />
                  <Metric label="Missing" value="3" tone="bg-rose-50 text-rose-700" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {['Nothing changes until you confirm', 'Original library tracks stay safe', 'Failed tracks are reported clearly'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/78">
                    <CheckCircle2 size={17} className="text-mint" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div><p className="font-black text-pulse">How it works</p><h2 className="mt-2 text-3xl font-black tracking-tight">Clear steps for non-technical users</h2></div>
          <p className="max-w-xl text-ink/60">Each action is guided, reviewed, and confirmed before it runs.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, copy]) => (
            <div key={title} className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-lilac font-black text-pulse">{number}</div>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-ink/60">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="rounded-[2.25rem] bg-ink p-7 text-white shadow-soft md:p-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="font-black text-mint">Main tools</p><h2 className="mt-2 text-3xl font-black tracking-tight">Everything starts from one dashboard</h2></div>
            <button onClick={onGetStarted} className="w-fit rounded-full bg-white px-5 py-3 font-black text-ink">Open dashboard</button>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {features.map((feature) => <div key={feature} className="rounded-3xl bg-white/10 p-5 font-black text-white/90">{feature}</div>)}
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-5 py-12 pb-20 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Shield, 'Private by design', 'Provider tokens are never shown in the frontend.'],
            [LockKeyhole, 'Confirm first', 'Destructive playlist changes always need approval.'],
            [Clock3, 'Track progress', 'Long operations run as jobs with visible status.'],
          ].map(([Icon, title, copy]) => (
            <div key={title as string} className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur">
              <Icon className="text-pulse" size={26} />
              <h3 className="mt-5 text-xl font-black">{title as string}</h3>
              <p className="mt-3 leading-7 text-ink/60">{copy as string}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function Platform({ name, tone }: { name: string; tone: string }) {
  return <div className="rounded-3xl bg-white/10 p-4"><div className={`mb-3 h-3 w-3 rounded-full ${tone}`} /><p className="font-black">{name}</p></div>
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className={`rounded-2xl p-4 ${tone}`}><p className="text-xs font-black uppercase tracking-wider opacity-70">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
}
