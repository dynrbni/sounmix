export function Toast({ message, type = 'info' }: { message: string; type?: string }) { return <div className="fixed bottom-5 right-5 rounded-2xl bg-ink p-4 text-white shadow-card">{message}</div> }
