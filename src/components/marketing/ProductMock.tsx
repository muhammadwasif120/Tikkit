import { Check, QrCode, Share2, Users } from 'lucide-react'
import { Badge } from '@/components/kit'

/** Static, decorative product preview used in the home hero. Not interactive. */
export function ProductMock() {
  const bars = [18, 26, 22, 41, 63, 88, 54]
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-5xl">
      <div className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2rem] opacity-80 blur-3xl"
        style={{ backgroundImage: 'radial-gradient(40rem 18rem at 25% 30%, rgb(var(--k-accent)/0.22), transparent 70%), radial-gradient(34rem 18rem at 85% 70%, rgb(var(--k-magenta)/0.22), transparent 70%)' }} />
      <div className="k-gradient-ring rounded-3xl bg-surface p-3 sm:p-4">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-[1.6fr_1fr]">
          {/* Sales card */}
          <div className="rounded-2xl bg-canvas/60 p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Rooftop Sunset Session</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight tnum text-fg">PKR 468,000</p>
              </div>
              <Badge tone="success">On sale</Badge>
            </div>
            <div className="mt-6 flex h-28 items-end gap-2">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-md" style={{
                  height: `${h}%`,
                  background: i === 5 ? 'linear-gradient(180deg, rgb(var(--k-magenta)), rgb(var(--k-accent)))' : 'rgb(var(--k-accent) / 0.28)',
                }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-subtle">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {/* Door */}
            <div className="rounded-2xl bg-canvas/60 p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-magenta/12 text-magenta"><QrCode className="h-5 w-5" /></span>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-fg">Mehreen Qureshi <Badge tone="magenta">VIP</Badge></p>
                  <p className="flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" /> Admitted at 9:42 pm</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>Checked in</span><span className="tnum text-fg">212 / 340</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-overlay"><div className="h-full w-[62%] rounded-full bg-accent" /></div>
            </div>
            {/* Requests + promoter */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-canvas/60 p-4 shadow-card">
                <Users className="h-4 w-4 text-subtle" />
                <p className="mt-3 text-2xl font-semibold tnum text-fg">7</p>
                <p className="text-xs text-muted">waiting on you</p>
              </div>
              <div className="rounded-2xl bg-canvas/60 p-4 shadow-card">
                <Share2 className="h-4 w-4 text-subtle" />
                <p className="mt-3 text-2xl font-semibold tnum text-magenta">144</p>
                <p className="text-xs text-muted">sold by promoters</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
