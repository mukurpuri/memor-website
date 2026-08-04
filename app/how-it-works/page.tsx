"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { JetBrains_Mono } from "next/font/google"

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
})

const CALENDLY_URL = "https://calendly.com/mukur-puri/30min"

function BookCallButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block shrink-0 rounded bg-black px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-80 ${className}`}
    >
      Book a 15-min setup call
    </a>
  )
}

// ── Graph data (illustrative PR: a change to billing.ts) ─────────────────────

type Role = "root" | "caller" | "transitive"
type NodeDef = { id: string; x: number; y: number; label: string; role: Role }
type EdgeDef = { from: string; to: string }

const nodes: NodeDef[] = [
  { id: "diff", x: 34, y: 130, label: "billing.ts", role: "root" },
  { id: "c1", x: 205, y: 45, label: "invoices.ts", role: "caller" },
  { id: "c2", x: 205, y: 130, label: "webhook.ts", role: "caller" },
  { id: "c3", x: 205, y: 215, label: "refunds.ts", role: "caller" },
  { id: "t1", x: 385, y: 18, label: "reports.ts", role: "transitive" },
  { id: "t2", x: 385, y: 80, label: "ledger.ts", role: "transitive" },
  { id: "t3", x: 385, y: 148, label: "stripeSync.ts", role: "transitive" },
  { id: "t4", x: 385, y: 230, label: "adminApi.ts", role: "transitive" },
]

const edges: EdgeDef[] = [
  { from: "diff", to: "c1" },
  { from: "diff", to: "c2" },
  { from: "diff", to: "c3" },
  { from: "c1", to: "t1" },
  { from: "c1", to: "t2" },
  { from: "c2", to: "t3" },
  { from: "c3", to: "t4" },
]

const flags: Record<string, "blocker" | "warning"> = {
  t3: "blocker",
  c2: "warning",
}

const COLOR = {
  root: "#0A0A0A",
  neutral: "#0A0A0A",
  faint: "#D4D4D4",
  edge: "#0A0A0A",
  edgeFaint: "#E5E5E5",
  clean: "#16A34A",
  warning: "#CA8A04",
  blocker: "#DC2626",
}

const steps = [
  {
    n: 1,
    emoji: "🧩",
    title: "Builds a dependency graph from the PR diff",
    body: "Every changed file becomes a node. Memor parses real imports and call sites across the repo to place it in the graph, not a guess from the file name.",
  },
  {
    n: 2,
    emoji: "🔗",
    title: "Walks it to find every real caller",
    body: "Starting from the changed file, Memor traverses the graph outward: direct callers, then their callers, until the full blast radius is mapped.",
  },
  {
    n: 3,
    emoji: "🚨",
    title: "Checks each one against deterministic pattern rules",
    body: "Every node in the blast radius is run through fixed, known-dangerous-change rules. No LLM, no guessing. A flag only fires when a rule actually matches.",
  },
]

// ── Diagram ────────────────────────────────────────────────────────────────

function nodeColor(node: NodeDef, step: number): string {
  if (node.role === "root") return COLOR.root
  if (step === 1) return COLOR.faint
  if (step === 3 && flags[node.id] === "blocker") return COLOR.blocker
  if (step === 3 && flags[node.id] === "warning") return COLOR.warning
  if (step === 3) return COLOR.clean
  return COLOR.neutral
}

function nodeOpacity(node: NodeDef, step: number): number {
  if (node.role === "root") return 1
  return step === 1 ? 0.35 : 1
}

function edgeStyle(step: number): { stroke: string; opacity: number } {
  return step === 1
    ? { stroke: COLOR.edgeFaint, opacity: 1 }
    : { stroke: "#B5B5B5", opacity: 1 }
}

function GraphDiagram({ step }: { step: number }) {
  const caption =
    step === 1
      ? "Graph built from the diff"
      : step === 2
      ? "Walking outward to every caller"
      : "Checked against pattern rules"

  return (
    <div className="overflow-hidden rounded border border-[#E5E5E5] bg-[#FAFAFA]">
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] bg-[#F5F5F5] px-4 py-2.5 text-[11px] text-[#6B6B6B]">
        <span
          className="h-2 w-2 rounded-full transition-colors duration-300"
          style={{ background: COLOR.root }}
        />
        <span>{caption}</span>
        <span className="ml-auto text-[10px] tracking-[0.06em] text-[#CFCFCF]">
          step {step}/3
        </span>
      </div>

      <svg viewBox="0 0 470 260" className="h-[260px] w-full">
        {edges.map((e, i) => {
          const from = nodes.find((n) => n.id === e.from)!
          const to = nodes.find((n) => n.id === e.to)!
          const es = edgeStyle(step)
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={es.stroke}
              strokeWidth={1.5}
              style={{ transition: "stroke 350ms ease" }}
            />
          )
        })}

        {nodes.map((n) => (
          <g key={n.id} style={{ transition: "opacity 350ms ease" }} opacity={nodeOpacity(n, step)}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.role === "root" ? 7 : 5.5}
              fill={nodeColor(n, step)}
              style={{ transition: "fill 350ms ease" }}
            >
              {n.role === "root" && step === 2 && (
                <animate attributeName="r" values="7;10;7" dur="1.4s" repeatCount="indefinite" />
              )}
            </circle>
            <text
              x={n.x + (n.role === "root" ? 12 : 10)}
              y={n.y + 3}
              fontSize={9}
              fill={step === 3 && flags[n.id] ? nodeColor(n, step) : "#6B6B6B"}
              style={{ transition: "fill 350ms ease" }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E5E5E5] px-4 py-3 text-[10px] text-[#6B6B6B]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR.root }} />
          changed file
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR.clean }} />
          checked, clean
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR.warning }} />
          warning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR.blocker }} />
          blocker
        </span>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  const [active, setActive] = useState(1)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.step)
            if (idx) setActive(idx)
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    )
    for (const el of sectionRefs.current) {
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <main className={mono.className + " min-h-screen bg-white text-[#0A0A0A]"}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[860px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <Link href="/" className="text-sm font-bold uppercase tracking-[0.12em]">
              Memor
            </Link>
            <span className="text-[11px] font-light tracking-[0.06em] text-[#6B6B6B]">
              How it works internally
            </span>
          </div>
          <BookCallButton />
        </div>
      </nav>

      <div className="mx-auto max-w-[860px] px-6">
        {/* HERO */}
        <section className="py-16">
          <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            Under the hood
          </p>
          <h1 className="mb-6 max-w-[560px] text-[clamp(1.6rem,3.6vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.02em]">
            Three deterministic steps.
            <br />
            No LLM in the loop.
          </h1>
          <p className="max-w-[480px] text-sm font-light leading-7 text-[#6B6B6B]">
            Scroll to watch a PR diff turn into a blast radius, then into a verdict. Every step below is grep-able in the source.
          </p>
        </section>

        {/* INTERACTIVE STEPPER */}
        <section className="grid grid-cols-1 gap-10 pb-20 md:grid-cols-[1fr_1fr]">
          <div className="order-1 md:order-2">
            <div className="sticky top-24">
              <GraphDiagram step={active} />
              <div className="mt-4 flex items-center justify-center gap-2">
                {steps.map((s) => (
                  <button
                    key={s.n}
                    onClick={() =>
                      sectionRefs.current[s.n - 1]?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                      active === s.n ? "bg-black" : "bg-[#E5E5E5]"
                    }`}
                    aria-label={`Jump to step ${s.n}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="order-2 flex flex-col gap-[16vh] md:order-1 md:gap-[28vh]">
            {steps.map((s, i) => (
              <div
                key={s.n}
                ref={(el) => {
                  sectionRefs.current[i] = el
                }}
                data-step={s.n}
                className={`transition-opacity duration-300 ${active === s.n ? "opacity-100" : "opacity-40"}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E5E5] text-[11px] font-medium">
                    {s.n}
                  </span>
                  <span className="text-xl">{s.emoji}</span>
                </div>
                <h2 className="mb-3 text-lg font-medium leading-snug tracking-[-0.01em]">{s.title}</h2>
                <p className="max-w-[420px] text-[13px] font-light leading-7 text-[#6B6B6B]">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-[#E5E5E5]" />

        {/* CTA */}
        <section className="py-16">
          <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">See it on a real PR</p>
          <p className="mb-8 max-w-[480px] text-[clamp(1rem,2.2vw,1.25rem)] font-medium leading-[1.4] tracking-[-0.01em]">
            One webhook, fifteen minutes. Every claim above is reproducible on your own repo.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="mailto:hello@memor.dev"
              className="inline-block border-b border-black pb-1 text-sm font-medium tracking-[0.02em] hover:opacity-60"
            >
              hello@memor.dev
            </a>
            <BookCallButton />
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E5E5]">
        <div className="mx-auto flex max-w-[860px] flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6B6B]">Memor</span>
          <span className="text-[10px] font-light tracking-[0.04em] text-[#CFCFCF]">
            deterministic · stateless · self-hostable
          </span>
        </div>
      </footer>
    </main>
  )
}
