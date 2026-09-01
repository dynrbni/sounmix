export function Badge({ label, color = 'pulse' }: { label: string; color?: string }) { return <span className="rounded-full px-3 py-1 text-xs font-black">{label}</span> }
