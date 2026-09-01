import { ArrowRightLeft, Bell, Combine, History, LayoutDashboard, ListChecks, Music2, Search, Settings, SlidersHorizontal } from 'lucide-react'

type DashboardLayoutProps = {
  activePage: string
  onNavigate: (page: string) => void
  children: React.ReactNode
}

const navItems = [
  ['Overview', LayoutDashboard],
  ['Transfer', ArrowRightLeft],
  ['Organize', SlidersHorizontal],
  ['Duplicates', ListChecks],
  ['Merge', Combine],
  ['History', History],
  ['Settings', Settings],
] as const

export function DashboardLayout({ activePage, onNavigate, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-aura text-ink">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/60 px-5 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="flex items-center gap-3 font-black tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white"><Music2 size={18} /></span>
            Sounmix
          </button>
          <div className="ml-auto hidden w-full max-w-md items-center gap-2 rounded-full bg-cloud px-4 py-3 text-sm font-semibold text-ink/45 md:flex">
            <Search size={17} /> Search playlists, tracks, operations
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"><Bell size={18} /></button>
          <div className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white">Profile</div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[250px_1fr] md:px-8">
        <aside className="h-fit rounded-[2rem] border border-white/80 bg-white/75 p-3 shadow-card backdrop-blur-xl md:sticky md:top-24">
          <div className="mb-3 rounded-[1.5rem] bg-lilac p-4">
            <p className="text-sm font-black text-pulse">Workspace</p>
            <p className="mt-1 text-lg font-black">My Music Library</p>
          </div>
          <nav className="grid gap-1">
            {navItems.map(([label, Icon]) => (
              <button
                key={label}
                onClick={() => onNavigate(label)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold ${activePage === label ? 'bg-ink text-white shadow-card' : 'text-ink/58 hover:bg-white hover:text-ink'}`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  )
}
