import { useState, useRef, useEffect } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, Mail, Music2, ShieldCheck } from 'lucide-react'

type AuthPageProps = {
  mode: 'Login' | 'Register'
  onModeChange: (mode: 'Login' | 'Register') => void
  onSuccess: () => void
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

export function AuthPage({ mode, onModeChange, onSuccess }: AuthPageProps) {
  const isLogin = mode === 'Login'
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const otpComplete = otp.every(Boolean)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  async function sendOtp() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${apiUrl}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Unable to send OTP')
      }

      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      if (data.data?.devOtp && data.data?.deliveryMode !== 'smtp') {
        setMessage(`OTP code generated: ${data.data.devOtp}`)
      } else {
        setMessage(`OTP has been sent to ${email}. Please check your inbox or spam folder.`)
      }
    } catch (err) {
      setMessage((err as Error).message || 'Could not send OTP. Check your email and backend settings.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${apiUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join('') }),
      })

      if (!response.ok) throw new Error('Invalid OTP')

      onSuccess()
    } catch {
      setMessage('Invalid or expired OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const rawVal = e.target.value.replace(/\D/g, '')
    const digit = rawVal.slice(-1)

    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const nextOtp = [...otp]
        nextOtp[index - 1] = ''
        setOtp(nextOtp)
        inputRefs.current[index - 1]?.focus()
      } else {
        const nextOtp = [...otp]
        nextOtp[index] = ''
        setOtp(nextOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const nextOtp = [...otp]
    const digits = pastedData.split('')
    digits.forEach((d, i) => {
      if (i < 6) nextOtp[i] = d
    })
    setOtp(nextOtp)

    const targetIndex = Math.min(digits.length, 5)
    inputRefs.current[targetIndex]?.focus()
  }

  function switchMode(nextMode: 'Login' | 'Register') {
    setStep('credentials')
    setOtp(['', '', '', '', '', ''])
    setMessage('')
    onModeChange(nextMode)
  }

  return (
    <main className="grid min-h-screen bg-aura p-5 text-ink lg:grid-cols-[1fr_0.9fr]">
      <section className="hidden items-center justify-center rounded-[2rem] bg-ink p-10 text-white shadow-soft lg:flex">
        <div className="max-w-lg">
          <div className="mb-8 grid h-16 w-16 place-items-center rounded-3xl bg-white text-ink"><Music2 size={28} /></div>
          <h1 className="text-5xl font-black tracking-[-0.05em]">Your playlists, organized safely.</h1>
          <p className="mt-5 leading-8 text-white/65">Create an account to connect music services, preview every change, and protect your account with OTP verification.</p>
          <div className="mt-8 grid gap-3"><SecurityItem icon={<ShieldCheck size={18} />} text="No provider tokens are stored in your browser" /><SecurityItem icon={<KeyRound size={18} />} text="OTP adds one more security step before login" /></div>
        </div>
      </section>
      <section className="flex items-center justify-center p-3 md:p-8">
        <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:p-8">
          <p className="font-black text-pulse">{step === 'otp' ? 'Verify OTP' : isLogin ? 'Welcome back' : 'Create account'}</p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.04em]">{step === 'otp' ? 'Enter security code' : isLogin ? 'Login to Sounmix' : 'Start with Sounmix'}</h2>
          {message && <div className="mt-5 rounded-3xl bg-lilac p-4 text-sm font-black text-pulse">{message}</div>}
          {step === 'credentials' ? (
            <div className="mt-7 grid gap-4">
              <label className="block"><span className="text-sm font-black text-ink/55">Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold outline-none focus:border-pulse" placeholder="you@example.com" /></label>
              <label className="block"><span className="text-sm font-black text-ink/55">Password</span><input type="password" className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold outline-none focus:border-pulse" placeholder="••••••••" /></label>
              {!isLogin && <label className="block"><span className="text-sm font-black text-ink/55">Confirm password</span><input type="password" className="mt-2 w-full rounded-2xl border border-ink/10 bg-cloud px-4 py-3 font-bold outline-none focus:border-pulse" placeholder="••••••••" /></label>}
              <button disabled={loading || !email} onClick={sendOtp} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 font-black text-white shadow-card disabled:opacity-40">{loading ? 'Sending OTP...' : isLogin ? 'Continue securely' : 'Create account'} <ArrowRight size={18} /></button>
              <button disabled={loading || !email} onClick={sendOtp} className="flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-6 py-4 font-black disabled:opacity-40"><Mail size={18} />Send OTP to email</button>
            </div>
          ) : (
            <div className="mt-7 grid gap-4">
              <div className="rounded-3xl bg-lilac p-5"><p className="flex items-center gap-2 font-black text-pulse"><KeyRound size={18} />6-digit OTP sent</p><p className="mt-2 text-sm font-semibold leading-6 text-ink/60">Enter the code sent to {email || 'your email'} to protect your account from unauthorized access.</p></div>
              <div className="grid grid-cols-6 gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    maxLength={1}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className="h-14 rounded-2xl border border-ink/10 bg-cloud text-center text-xl font-black outline-none transition-all focus:border-pulse focus:bg-white focus:shadow-sm"
                  />
                ))}
              </div>
              <button disabled={!otpComplete || loading} onClick={verifyOtp} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 font-black text-white shadow-card disabled:opacity-40">{loading ? 'Verifying...' : 'Verify and enter'} <CheckCircle2 size={18} /></button>
              <div className="flex items-center justify-between text-sm font-bold text-ink/55"><button onClick={() => setStep('credentials')} className="text-pulse">Back</button><button onClick={sendOtp} className="text-pulse">Resend OTP</button></div>
            </div>
          )}
          <p className="mt-6 text-center text-sm font-semibold text-ink/55">
            {isLogin ? 'No account yet?' : 'Already have an account?'} <button onClick={() => switchMode(isLogin ? 'Register' : 'Login')} className="font-black text-pulse">{isLogin ? 'Register' : 'Login'}</button>
          </p>
        </div>
      </section>
    </main>
  )
}

function SecurityItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="rounded-3xl bg-white/10 p-5"><p className="flex items-center gap-2 font-black">{icon}{text}</p></div>
}

