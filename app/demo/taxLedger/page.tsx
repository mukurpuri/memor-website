"use client"

import { useState } from "react"
import Link from "next/link"
import { JetBrains_Mono } from "next/font/google"
import { prDiffs } from "./diffs"

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
})

const CALENDLY_URL = "https://calendly.com/mukur-puri/30min"
const REPO_URL = "https://github.com/mukurpuri/TaxLedger"

// ── Diff rendering ─────────────────────────────────────────────────────────
// Real diff text from GitHub, unified format. Strips the git/index/+++/--- header
// lines (the file name is already shown in the card header above) and colors each
// line by its leading +/-/@@ marker.

function DiffView({ diff }: { diff: string }) {
  const lines = diff
    .split("\n")
    .filter((l) => !l.startsWith("diff --git") && !l.startsWith("index ") && !l.startsWith("+++") && !l.startsWith("---"))
    .filter((l, i, arr) => !(l === "" && i === arr.length - 1))

  return (
    <div className="overflow-x-auto bg-[#0A0A0A] px-4 py-3">
      <pre className="text-[11.5px] leading-[1.7]">
        {lines.map((line, i) => {
          if (line.startsWith("@@")) {
            return (
              <div key={i} className="text-[#6B9DC2]">
                {line}
              </div>
            )
          }
          if (line.startsWith("+")) {
            return (
              <div key={i} className="bg-[#0F2818] text-[#5FD98A]">
                {line}
              </div>
            )
          }
          if (line.startsWith("-")) {
            return (
              <div key={i} className="bg-[#2A1414] text-[#F27878]">
                {line}
              </div>
            )
          }
          return (
            <div key={i} className="text-[#8A8A8A]">
              {line}
            </div>
          )
        })}
      </pre>
    </div>
  )
}

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

// ── Data ───────────────────────────────────────────────────────────────────

type PR = { number: number; title: string; file: string; comment: string }
type Category = { id: string; icon: string; name: string; description: string; prs: PR[] }

const categories: Category[] = [
  {
    id: "blast-radius",
    icon: "💥",
    name: "Blast radius",
    description: "A change in one file silently affects others that depend on it.",
    prs: [
      {
        number: 1,
        title: "Simplify tax calculation return shape",
        file: "taxCalculator.ts",
        comment:
          "Blast radius: 5 files (5 transitive), called by taxRoutes.ts, filingService.ts, app.ts, filingRoutes.ts, index.ts",
      },
      {
        number: 2,
        title: "Extract shared rounding helper",
        file: "utils.ts",
        comment:
          "Blast radius: 13 files (13 transitive), called by app.ts, taxRoutes.ts, invoiceGenerator.ts, paymentProcessor.ts +9 more",
      },
    ],
  },
  {
    id: "circular-import",
    icon: "🔁",
    name: "Circular import",
    description: "A new import closes a cycle between files — works until module load order breaks it.",
    prs: [
      {
        number: 22,
        title: "Share bracket lookup between tax and discount logic",
        file: "discountEngine.ts",
        comment:
          "Blast radius: 6 files (6 transitive), called by taxCalculator.ts, taxRoutes.ts, filingService.ts +3 more",
      },
      {
        number: 21,
        title: "Reuse calculation context across tax modules",
        file: "calculationContext.ts",
        comment:
          "Blast radius: 7 files (7 transitive), called by discountEngine.ts, taxCalculator.ts, taxRoutes.ts +4 more",
      },
    ],
  },
  {
    id: "access-control",
    icon: "🔐",
    name: "Access control regression",
    description: "An auth check quietly disappears from a route.",
    prs: [
      {
        number: 20,
        title: "Streamline admin route middleware chain",
        file: "adminRoutes.ts",
        comment:
          "requireRole removed from route handler; endpoint is now accessible without this authorization check",
      },
      {
        number: 19,
        title: "Remove redundant auth check on filing submit",
        file: "paymentRoutes.ts",
        comment:
          "An authorization check (requireAuth) was removed. If this handler still accepts a resource identifier from the caller, requests may now bypass a permission check that used to gate them.",
      },
    ],
  },
  {
    id: "signature-change",
    icon: "✂️",
    name: "Function signature change",
    description: "A parameter is added or reordered; not every caller gets updated.",
    prs: [
      {
        number: 16,
        title: "Add currency support to tax calculation",
        file: "taxCalculator.ts",
        comment: "API contract changed; external consumers exist",
      },
      {
        number: 15,
        title: "Reorder GST calculation parameters for consistency",
        file: "gstCalculator.ts",
        comment: "API contract changed; external consumers exist",
      },
    ],
  },
  {
    id: "async-failure",
    icon: "⚡",
    name: "Untraceable async failure",
    description: "A try/catch around a real network call is removed — failures now propagate unhandled instead of being logged.",
    prs: [
      {
        number: 14,
        title: "Simplify payment gateway call",
        file: "paymentGateway.ts",
        comment:
          "A try/catch block around an await was removed. The awaited call's failure used to be caught here — if it throws now, the error propagates uncaught instead of being handled the way this code previously handled it.",
      },
      {
        number: 13,
        title: "Clean up payment processor error wrapping",
        file: "paymentProcessor.ts",
        comment:
          "Same finding, on paymentProcessor.ts — the try/catch around the gateway call was removed here too.",
      },
    ],
  },
  {
    id: "error-handler",
    icon: "🧯",
    name: "Error-handler weakening",
    description: "Error handling around a real operation is removed or its logging is cut.",
    prs: [
      {
        number: 12,
        title: "Simplify document upload handling",
        file: "uploadHandler.ts",
        comment:
          "A try/catch block around an await was removed — an upload failure now propagates uncaught instead of being handled",
      },
      {
        number: 11,
        title: "Simplify notification dispatch",
        file: "notifier.ts",
        comment:
          "A try/catch block around an await was removed — a failed notification now propagates uncaught instead of being handled",
      },
    ],
  },
  {
    id: "react-hook",
    icon: "⚛️",
    name: "React hook regression",
    description: "A useEffect loses its cleanup or its dependency array — leaks or stale state follow.",
    prs: [
      {
        number: 10,
        title: "Simplify refund status polling",
        file: "useFilingStatus.ts",
        comment:
          "A bare return () => {...} was removed. If this was a useEffect cleanup, whatever it was tearing down — an event listener, a subscription, a timer — now leaks: it keeps running after the component unmounts, and can fire against stale state.",
      },
      {
        number: 9,
        title: "Refactor filing status hook",
        file: "useFilingStatus.ts",
        comment:
          "A hook's dependency array shrank (1 → 0 entries). If the removed dependency is still referenced inside the hook, it now closes over a stale value instead of reacting to changes — a common source of bugs that only show up intermittently.",
      },
    ],
  },
  {
    id: "secret-committed",
    icon: "🔑",
    name: "Secret committed",
    description: "A real credential ends up hardcoded or logged in source.",
    prs: [
      {
        number: 8,
        title: "Add local dev fallback for payment gateway key",
        file: "env.ts",
        comment: "Stripe key committed to source as a literal string; rotate this credential and read it from env instead",
      },
      {
        number: 7,
        title: "Add debug logging for gateway integration issue",
        file: "paymentGateway.ts",
        comment: "apikey credential committed to source for the first time; verify this is not a production secret",
      },
    ],
  },
  {
    id: "dependency-risk",
    icon: "📦",
    name: "Dependency risk",
    description: "A version pin is loosened, or a dependency still in use gets removed.",
    prs: [
      {
        number: 6,
        title: "Loosen dependency version pins",
        file: "package.json",
        comment: "Flagged in package.json — may fail at runtime without surfacing an error",
      },
      {
        number: 23,
        title: "Remove unused multer dependency",
        file: "package.json",
        comment: "Flagged in package.json — may fail at runtime without surfacing an error",
      },
    ],
  },
  {
    id: "validation-loosening",
    icon: "🛡️",
    name: "Validation loosening",
    description: "A Zod schema quietly stops enforcing a real constraint.",
    prs: [
      {
        number: 4,
        title: "Simplify filing request schema",
        file: "schemas.ts",
        comment: "API contract changed; external consumers exist",
      },
    ],
  },
  {
    id: "data-integrity",
    icon: "🗄️",
    name: "Data-integrity regression",
    description: "A database write loses its scope or its uniqueness guarantee.",
    prs: [
      {
        number: 24,
        title: "Simplify draft filing cleanup",
        file: "seed.ts",
        comment:
          "deleteMany() called with no filter — this deletes every row in the table, not a scoped subset. If a where clause was meant to be here, its absence won't throw; it'll just wipe the table.",
      },
    ],
  },
]

const totalPRs = categories.reduce((n, c) => n + c.prs.length, 0)

export default function TaxLedgerDemoPage() {
  const [activeId, setActiveId] = useState(categories[0].id)
  const active = categories.find((c) => c.id === activeId)!

  return (
    <main className={mono.className + " min-h-screen bg-white text-[#0A0A0A]"}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <Link href="/" className="text-sm font-bold uppercase tracking-[0.12em]">
              Memor
            </Link>
            <span className="text-[11px] font-light tracking-[0.06em] text-[#6B6B6B]">
              Demo · TaxLedger
            </span>
          </div>
          <BookCallButton />
        </div>
      </nav>

      <div className="mx-auto max-w-[1040px] px-6">
        {/* HERO */}
        <section className="py-14">
          <h1 className="mb-4 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            What kind of issues does Memor catch?
          </h1>
          <p className="max-w-[880px] text-sm font-light leading-7 text-[#6B6B6B]">
            TaxLedger is a real, working Indian tax-filing app — Express, TypeScript, Prisma, Zod, React.
            {totalPRs} PRs below, across {categories.length} categories, each written to look like
            ordinary engineering work: a refactor, a cleanup, a dependency bump. Memor caught every one
            anyway, automatically, before merge. What you see per PR is the actual diff and the actual
            comment Memor posted, unedited.
          </p>
        </section>

        {/* SIDEBAR + CONTENT */}
        <section className="grid grid-cols-1 gap-8 pb-24 md:grid-cols-[240px_1fr]">
          {/* SIDEBAR */}
          <nav className="md:sticky md:top-24 md:self-start">
            <div className="scrollbar-none -mx-6 flex gap-1 overflow-x-auto px-6 pb-2 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
              {categories.map((c) => {
                const isActive = c.id === activeId
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded px-3 py-2.5 text-left text-[12.5px] transition-colors md:w-full ${
                      isActive
                        ? "bg-black text-white"
                        : "text-[#0A0A0A] hover:bg-[#F5F5F5]"
                    }`}
                  >
                    <span className="text-[15px] leading-none">{c.icon}</span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span
                      className={`shrink-0 text-[10px] tabular-nums ${
                        isActive ? "text-white/60" : "text-[#B5B5B5]"
                      }`}
                    >
                      {c.prs.length}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* CONTENT */}
          <div>
            <div className="mb-6 flex items-start gap-3 border-b border-[#E5E5E5] pb-6">
              <span className="text-2xl leading-none">{active.icon}</span>
              <div>
                <h2 className="text-[18px] font-bold tracking-[-0.01em]">{active.name}</h2>
                <p className="mt-1.5 text-[15px] font-light leading-7 text-[#6B6B6B]">
                  {active.description}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {active.prs.map((pr) => (
                <div key={pr.number} className="overflow-hidden rounded border border-[#E5E5E5]">
                  <div className="flex items-center gap-3 border-b border-[#E5E5E5] bg-[#F5F5F5] px-4 py-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                      M
                    </div>
                    <a
                      href={`${REPO_URL}/pull/${pr.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12.5px] font-medium hover:underline"
                    >
                      #{pr.number} — {pr.title}
                    </a>
                    <span className="ml-auto shrink-0 rounded border border-[#E5E5E5] bg-white px-2 py-0.5 text-[10px] tracking-[0.02em] text-[#6B6B6B]">
                      {pr.file}
                    </span>
                  </div>
                  {prDiffs[pr.number] && <DiffView diff={prDiffs[pr.number]} />}
                  <div className="border-t border-[#E5E5E5] bg-white p-4">
                    <p className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-[#B5B5B5]">
                      Memor's comment
                    </p>
                    <p className="text-[12.5px] leading-6 text-[#0A0A0A]">{pr.comment}</p>
                  </div>
                  <div className="border-t border-[#F5F5F5] bg-white px-4 py-2">
                    <a
                      href={`${REPO_URL}/pull/${pr.number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10.5px] tracking-[0.02em] text-[#6B6B6B] hover:text-black hover:underline"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-[#E5E5E5]" />

        {/* CTA */}
        <section className="py-16">
          <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-[#6B6B6B]">
            Try it on your own repo
          </p>
          <p className="mb-8 max-w-[480px] text-[clamp(1.05rem,2.2vw,1.3rem)] font-medium leading-[1.4] tracking-[-0.01em]">
            If any of this looks useful against your own repos, happy to get a team set up. One GitHub install, nothing leaves your infrastructure at rest.
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
        <div className="mx-auto flex max-w-[1040px] flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
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
