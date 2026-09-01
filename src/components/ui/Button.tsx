export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className="rounded-2xl px-5 py-3 font-bold" {...props}>{children}</button> }
