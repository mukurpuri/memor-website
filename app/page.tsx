// app/page.tsx
import { JetBrains_Mono } from "next/font/google"

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
})

const findings = [
  {
    severity: "blocker",
    color: "bg-red-600",
    text: "infra/rds.tf: resource renamed without a moved block; Terraform destroys and recreates payments-db on apply",
  },
  {
    severity: "blocker",
    color: "bg-red-600",
    text: "src/routes/billing.ts: POST /billing removed; 3 repos call this endpoint",
  },
  {
    severity: "warning",
    color: "bg-yellow-600",
    text: "src/middleware/auth.ts: jwt_secret hardcoded as literal string; was read from env",
  },
]

const capabilities = [
  { icon: "💥", label: "Blast radius" },
  { icon: "🔗", label: "Downstream breakage" },
  { icon: "🤖", label: "Hallucinated APIs" },
  { icon: "⚠️", label: "Risky patterns" },
]

const properties = [
  {
    title: "Deterministic",
    text: "Same diff in, same verdict out. Every claim is derivable. Grep the source, verify the output. No probabilistic components at runtime.",
  },
  {
    title: "Quiet by design",
    text: "Three lines max per PR. Clean PR gets one line: all clear. Memor is tuned to earn silence, not fill it.",
  },
  {
    title: "Private by architecture",
    text: "Stateless. Self-hostable. No third-party calls. Source code exists only for analysis and is deleted immediately.",
  },
]

const security = [
  "No source stored. Code is fetched, analyzed in memory, and deleted.",
  "No third-party calls. Analysis runs entirely on your infrastructure.",
  "No LLM at runtime. Every verdict is deterministic and reproducible.",
  "Minimum-scope tokens. Read repository + write PR comments only.",
  "Self-hosted available. Single Docker container inside your network.",
]

export default function Page() {
  return (
    <main className={mono.className + " min-h-screen bg-white text-[#0A0A0A]"}>
      <div className="mx-auto max-w-[680px] px-6">
        {/* NAV */}
        <nav className="pt-7">
          <div className="flex items-center justify-between">
            <a href="/" className="text-sm font-bold uppercase tracking-[0.12em]">
              Memor
            </a>
            <span className="text-[11px] font-light tracking-[0.06em] text-[#6B6B6B]">
              PR risk analysis · deterministic
            </span>
          </div>
        </nav>

        <div className="mt-5 h-px w-full bg-black" />

        {/* HERO */}
        <section className="py-20">
          <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            The merge gate
          </p>

          <h1 className="mb-6 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.02em]">
            Coding is solved.
            <br />
            Software isn't.
          </h1>

          <p className="max-w-[480px] text-sm font-light leading-7 text-[#6B6B6B]">
            AI writes code faster than humans can review it. Memor sits on every PR and posts <span className="font-medium text-black">one deterministic comment</span>. Same diff in, same verdict out. <span className="font-medium text-black">No LLM at runtime.</span>
          </p>
        </section>

        {/* MR CARD */}
        <div className="overflow-hidden rounded border border-[#E5E5E5]">
          <div className="flex items-center gap-3 border-b border-[#E5E5E5] bg-[#F5F5F5] px-4 py-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
              M
            </div>
            <span className="text-[11px] text-[#6B6B6B]">
              <span className="font-medium text-black">Memor</span> @memor · just now
            </span>
            <span className="ml-auto rounded border border-[#E5E5E5] px-2 py-0.5 text-[10px] tracking-[0.04em] text-[#6B6B6B]">
              Reporter
            </span>
          </div>

          <div className="bg-white p-4">
            <div className="mb-4 flex items-start gap-2 text-sm font-medium">
              <span>⚠</span>
              <span>
                High risk: merging this can destroy the <code className="rounded bg-[#F5F5F5] px-1 py-0.5 text-[12px]">payments-db</code> RDS instance
              </span>
            </div>

            <div className="space-y-3">
              {findings.map((f, i) => (
                <div key={i} className="border-b border-[#F5F5F5] pb-3 last:border-0 last:pb-0">
                  <div className="flex gap-3">
                    <div className="w-20 shrink-0 pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${f.color}`} />
                        <span className="text-[11px] font-medium lowercase">{f.severity}</span>
                      </div>
                    </div>
                    <p className="text-[12px] leading-5 text-[#0A0A0A]">{f.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[#F5F5F5] pt-3 text-[11px] text-[#6B6B6B]">
              3 findings · 8 files analyzed · full coverage
            </div>
          </div>

          <div className="border-t border-[#F5F5F5] bg-[#F5F5F5] px-4 py-2 text-[11px] text-[#6B6B6B]">
            Edited just now by Memor
          </div>
        </div>

        {/* CAPABILITIES */}
        <section className="mt-8">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            Detects
          </p>

          <div className="grid grid-cols-2 overflow-hidden rounded border border-[#E5E5E5] sm:grid-cols-4">
            {capabilities.map((c, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-2 border-r border-b border-[#E5E5E5] px-4 py-5 text-center last:border-r-0 sm:last:border-r-0 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r [&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b sm:[&:nth-last-child(-n+4)]:border-b-0">
                <span className="text-lg">{c.icon}</span>
                <span className="text-[12px] leading-5 text-[#6B6B6B]">{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PROPERTIES */}
        <section className="py-16">
          <div className="border-t border-[#E5E5E5]">
            {properties.map((p, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 border-b border-[#E5E5E5] py-6 sm:grid-cols-[160px_1fr] sm:gap-6">
                <div className="pt-1 text-[11px] font-medium uppercase tracking-[0.08em]">
                  {p.title}
                </div>
                <p className="text-[13px] font-light leading-7 text-[#6B6B6B]">
                  <span className="font-medium text-black">{p.text.split(". ")[0]}.</span> {p.text.split(". ").slice(1).join(". ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-[#E5E5E5]" />

        {/* SECURITY */}
        <section className="py-16">
          <p className="mb-6 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            Security posture
          </p>

          <ul className="space-y-4">
            {security.map((item, i) => (
              <li key={i} className="flex gap-3 text-[13px] font-light leading-7 text-[#6B6B6B]">
                <span className="text-[#CFCFCF]">—</span>
                <span>
                  <span className="font-medium text-black">{item.split(". ")[0]}.</span> {item.split(". ").slice(1).join(". ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-[#E5E5E5]" />

        {/* CTA */}
        <section className="py-20">
          <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            Early access
          </p>

          <p className="mb-8 max-w-[480px] text-[clamp(1.1rem,2.5vw,1.4rem)] font-medium leading-[1.4] tracking-[-0.01em]">
            Piloting with a small number of GitLab and GitHub teams. One repo, fifteen minutes.
          </p>

          <a href="mailto:hello@memor.dev" className="inline-block border-b border-black pb-1 text-sm font-medium tracking-[0.02em] hover:opacity-60">
            hey@memor.dev
          </a>

          <p className="mt-4 text-[11px] font-light text-[#6B6B6B]">
            Install is one webhook. Two weeks, nothing useful caught, remove it and tell us why.
          </p>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E5E5]">
        <div className="mx-auto flex max-w-[680px] flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">
            Memor
          </span>
          <span className="text-[10px] font-light tracking-[0.04em] text-[#CFCFCF]">
            deterministic · stateless · self-hostable
          </span>
        </div>
      </footer>
    </main>
  )
}