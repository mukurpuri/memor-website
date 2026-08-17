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

// Every file touched in a diff, parsed straight from its own "diff --git a/X b/Y"
// header lines — no separate fetch needed, the diff text already has this.
function filesInDiff(diff: string): string[] {
  const matches = diff.matchAll(/^diff --git a\/(.+?) b\/.+$/gm)
  return [...matches].map((m) => m[1])
}

// ── Diff rendering ─────────────────────────────────────────────────────────
// Real diff text from GitHub, unified format, one or more files per PR. Splits
// on "diff --git" boundaries and renders a file-name header for each section —
// a diff spanning multiple files (real ones do: PR2 touches 4) needs that
// boundary shown, not silently dropped along with the noisy index/+++/--- lines.

type DiffSection = { file: string; lines: string[] }

function parseDiffSections(diff: string): DiffSection[] {
  const rawLines = diff.split("\n")
  const sections: DiffSection[] = []
  let current: DiffSection | null = null

  for (const line of rawLines) {
    const header = line.match(/^diff --git a\/(.+?) b\/.+$/)
    if (header) {
      current = { file: header[1], lines: [] }
      sections.push(current)
      continue
    }
    if (!current) continue
    if (line.startsWith("index ") || line.startsWith("+++") || line.startsWith("---")) continue
    current.lines.push(line)
  }

  // Drop a single trailing blank line per section (artifact of the split above).
  for (const s of sections) {
    while (s.lines.length > 0 && s.lines[s.lines.length - 1] === "") s.lines.pop()
  }
  return sections
}

function DiffLine({ line }: { line: string }) {
  if (line.startsWith("@@")) return <div className="text-[#6B9DC2]">{line}</div>
  if (line.startsWith("+")) return <div className="bg-[#0F2818] text-[#5FD98A]">{line}</div>
  if (line.startsWith("-")) return <div className="bg-[#2A1414] text-[#F27878]">{line}</div>
  return <div className="text-[#8A8A8A]">{line}</div>
}

function DiffView({ diff }: { diff: string }) {
  const sections = parseDiffSections(diff)

  return (
    <div className="divide-y divide-[#30363d] overflow-x-auto bg-[#0A0A0A]">
      {sections.map((section, si) => (
        <div key={si}>
          {sections.length > 1 && (
            <div className="flex items-center gap-2 border-b border-[#3d3320] border-l-2 border-l-[#d4a72c] bg-[#1a1710] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#d4a72c]">
              <span>📄</span>
              {section.file}
            </div>
          )}
          <pre className="px-4 py-3 text-[11.5px] leading-[1.7]">
            {section.lines.map((line, i) => (
              <DiffLine key={i} line={line} />
            ))}
          </pre>
        </div>
      ))}
    </div>
  )
}

// ── GitHub-comment-styled render of Memor's actual PR comment ───────────────
// Warnings render collapsed behind a disclosure (matching how the real comment
// hides low-severity findings by default); blockers render open, since that's
// the one thing worth seeing without an extra click.

function FindingsTable({ findings }: { findings: Finding[] }) {
  return (
    <div className="overflow-hidden rounded border border-[#30363d]">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e]">
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">File name</th>
            <th className="px-3 py-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={i} className={i > 0 ? "border-t border-[#21262d]" : ""}>
              <td className="whitespace-nowrap px-3 py-2.5 align-top text-[#e6edf3]">
                {f.severity === "blocker" ? "🔴 blocker" : "🟡 warning"}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-top text-[#58a6ff]">{f.file}</td>
              <td className="px-3 py-2.5 align-top leading-5 text-[#c9d1d9]">{f.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GitHubComment({ pr, fileCount }: { pr: PR; fileCount: number }) {
  const blockers = pr.findings.filter((f) => f.severity === "blocker")
  const warnings = pr.findings.filter((f) => f.severity === "warning")
  const hasBlocker = blockers.length > 0
  // Real behavior: blockers always render open, in a table with no toggle. Warnings
  // render behind a collapsed disclosure — always, even alongside blockers, which is
  // exactly the shape PR13/PR14 show (one open blocker row, one collapsed warning).
  const [warningsOpen, setWarningsOpen] = useState(!hasBlocker)
  const dotColor = hasBlocker ? "bg-[#f85149]" : "bg-[#d29922]"
  const headlineParts = pr.headline.split(/(`[^`]+`)/g)

  return (
    <div className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
      {/* comment header */}
      <div className="flex items-center gap-2.5 border-b border-[#30363d] bg-[#161b22] px-4 py-3">
        <img src="/memor-logo.svg" alt="" className="h-6 w-6 shrink-0 rounded bg-white p-0.5" />
        <span className="text-[13px] font-semibold text-[#e6edf3]">memor-impact-analyzer</span>
        <span className="rounded-full border border-[#30363d] bg-[#21262d] px-1.5 py-[1px] text-[10px] font-medium text-[#8b949e]">
          Bot
        </span>
        <span className="text-[12px] text-[#8b949e]">commented on this PR</span>
        <span className="ml-auto text-[14px] text-[#8b949e]">•••</span>
      </div>

      {/* comment body */}
      <div className="px-4 py-4">
        <div className="mb-3 flex items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          <p className="text-[13px] font-semibold leading-5 text-[#e6edf3]">
            {headlineParts.map((part, i) =>
              part.startsWith("`") ? (
                <code key={i} className="rounded bg-[#21262d] px-1 py-0.5 text-[12px] font-normal text-[#e6edf3]">
                  {part.slice(1, -1)}
                </code>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        </div>

        {blockers.length > 0 && (
          <div className={warnings.length > 0 ? "mb-3" : ""}>
            <FindingsTable findings={blockers} />
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <button
              onClick={() => setWarningsOpen(!warningsOpen)}
              className="mb-1 flex items-center gap-1.5 text-[12px] text-[#e6edf3]"
            >
              <span className={`inline-block transition-transform ${warningsOpen ? "rotate-90" : ""}`}>▶</span>
              <span className="text-[#d29922]">⚠️</span>
              <span>
                {warnings.length} warning{warnings.length > 1 ? "s" : ""}
              </span>
            </button>
            {warningsOpen && <FindingsTable findings={warnings} />}
          </div>
        )}

        <p className="mt-3 text-[11.5px] italic text-[#8b949e]">
          {pr.findings.length} finding{pr.findings.length > 1 ? "s" : ""} · {fileCount} file{fileCount > 1 ? "s" : ""} analyzed
        </p>
      </div>
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

type Finding = { severity: "blocker" | "warning"; file: string; reason: string }
type PR = {
  number: number
  title: string
  file: string
  headline: string
  purpose: string
  findings: Finding[]
}
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
        purpose: "Collapse the return value down to just the final number now that most callers only need the total, not the full breakdown.",
        headline: "Warning → review flagged items before merging",
        findings: [
          {
            severity: "warning",
            file: "taxCalculator.ts",
            reason: "Blast radius: 5 files (5 transitive), called by taxRoutes.ts, filingService.ts, app.ts, filingRoutes.ts, index.ts",
          },
        ],
      },
      {
        number: 2,
        title: "Extract shared rounding helper",
        file: "utils.ts",
        purpose: "DRY pass: tax and GST calculations were each rounding currency their own way — pull it into one shared helper.",
        headline: "Warning → review flagged items before merging",
        findings: [
          {
            severity: "warning",
            file: "utils.ts",
            reason: "Blast radius: 13 files (13 transitive), called by app.ts, taxRoutes.ts, invoiceGenerator.ts, paymentProcessor.ts, paymentRepository.ts, notifier.ts, filingRepository.ts, filingService.ts, index.ts, paymentRoutes.ts, adminRoutes.ts, uploadHandler.ts, filingRoutes.ts",
          },
        ],
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
        purpose: "Reuse the existing bracket-lookup logic in the discount engine instead of duplicating it.",
        headline: "Warning → review flagged items before merging",
        findings: [
          {
            severity: "warning",
            file: "discountEngine.ts",
            reason: "Blast radius: 6 files (6 transitive), called by taxCalculator.ts, taxRoutes.ts, filingService.ts, app.ts, filingRoutes.ts, index.ts",
          },
        ],
      },
      {
        number: 21,
        title: "Reuse calculation context across tax modules",
        file: "calculationContext.ts",
        purpose: "Share the calculation context helper across tax modules instead of each one rebuilding it.",
        headline: "Warning → review flagged items before merging",
        findings: [
          {
            severity: "warning",
            file: "calculationContext.ts",
            reason: "Blast radius: 7 files (7 transitive), called by discountEngine.ts, taxCalculator.ts, taxRoutes.ts, filingService.ts, app.ts, filingRoutes.ts, index.ts",
          },
        ],
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
        purpose: "Simplify and deduplicate the middleware chain on the admin routes.",
        headline: "High risk → merging this changes access control in `adminRoutes.ts`; verify users still have correct permissions",
        findings: [
          {
            severity: "blocker",
            file: "adminRoutes.ts",
            reason: "requireRole removed from route handler; endpoint is now accessible without this authorization check",
          },
        ],
      },
      {
        number: 19,
        title: "Remove redundant auth check on filing submit",
        file: "paymentRoutes.ts",
        purpose: "Remove what looked like a duplicate auth check on this route.",
        headline: "High risk → merging this changes access control in `paymentRoutes.ts`; verify users still have correct permissions",
        findings: [
          {
            severity: "blocker",
            file: "paymentRoutes.ts",
            reason: "An authorization check (requireAuth) was removed. If this handler still accepts a resource identifier from the caller, requests may now bypass a permission check that used to gate them.",
          },
        ],
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
        purpose: "Add a currency parameter to the tax calculator ahead of multi-currency support.",
        headline: "High risk → merging this will break external consumers on deploy",
        findings: [{ severity: "blocker", file: "taxCalculator.ts", reason: "Function signature changed. Callers not caught by the import graph may break." }],
      },
      {
        number: 15,
        title: "Reorder GST calculation parameters for consistency",
        file: "gstCalculator.ts",
        purpose: "Reorder the GST calculator's parameters to match the tax calculator's convention.",
        headline: "High risk → merging this will break external consumers on deploy",
        findings: [
          { severity: "blocker", file: "gstCalculator.ts", reason: "Function signature changed. Callers not caught by the import graph may break." },
          { severity: "blocker", file: "taxRoutes.ts", reason: "Blast radius: changed, called by app.ts, index.ts" },
        ],
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
        purpose: "Simplify the gateway call since the SDK already handles retries.",
        headline: "High risk → merging this will break `paymentProcessor.ts` and `paymentRoutes.ts` and 2 others on deploy",
        findings: [
          {
            severity: "blocker",
            file: "paymentGateway.ts",
            reason:
              "A try/catch block around an await was removed. The awaited call's failure used to be caught here — if it throws now, the error propagates uncaught instead of being handled the way this code previously handled it.",
          },
          {
            severity: "warning",
            file: "paymentGateway.ts",
            reason: "Blast radius: 4 files (4 transitive), called by paymentProcessor.ts, paymentRoutes.ts, app.ts, index.ts",
          },
        ],
      },
      {
        number: 13,
        title: "Clean up payment processor error wrapping",
        file: "paymentProcessor.ts",
        purpose: "Remove error wrapping around the gateway call that looked unnecessary.",
        headline: "High risk → merging this will break `paymentRoutes.ts` and `app.ts` and 1 other on deploy",
        findings: [
          {
            severity: "blocker",
            file: "paymentProcessor.ts",
            reason:
              "A try/catch block around an await was removed. The awaited call's failure used to be caught here — if it throws now, the error propagates uncaught instead of being handled the way this code previously handled it.",
          },
          {
            severity: "warning",
            file: "paymentProcessor.ts",
            reason: "Blast radius: 3 files (3 transitive), called by paymentRoutes.ts, app.ts, index.ts",
          },
        ],
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
        purpose: "Remove handling that looked redundant with what the multer middleware already covers upstream.",
        headline: "High risk → merging this alters a table schema; downstream services may fail",
        findings: [
          { severity: "blocker", file: "uploadHandler.ts", reason: "Database schema change. Services querying affected tables may need updates." },
          {
            severity: "blocker",
            file: "uploadHandler.ts",
            reason:
              "A try/catch block around an await was removed. The awaited call's failure used to be caught here — if it throws now, the error propagates uncaught instead of being handled the way this code previously handled it.",
          },
        ],
      },
      {
        number: 11,
        title: "Simplify notification dispatch",
        file: "notifier.ts",
        purpose: "Remove handling around a notification send that \"shouldn't be able to fail.\"",
        headline: "High risk → merging this alters a table schema; downstream services may fail",
        findings: [
          { severity: "blocker", file: "notifier.ts", reason: "Database schema change. Services querying affected tables may need updates." },
          {
            severity: "blocker",
            file: "filingService.ts",
            reason: "Blast radius: 3 files (3 transitive), called by filingRoutes.ts, app.ts, index.ts",
          },
          {
            severity: "blocker",
            file: "notifier.ts",
            reason:
              "A try/catch block around an await was removed. The awaited call's failure used to be caught here — if it throws now, the error propagates uncaught instead of being handled the way this code previously handled it.",
          },
        ],
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
        purpose: "Simplify the polling effect now that the component stays mounted for the whole session.",
        headline: "Warning → review flagged items before merging",
        findings: [
          {
            severity: "warning",
            file: "useFilingStatus.ts",
            reason: "Blast radius: 3 files (3 transitive), called by RefundStatusTicker.tsx, App.tsx, main.tsx",
          },
          {
            severity: "warning",
            file: "useFilingStatus.ts",
            reason:
              "A bare return () => {...} was removed. If this was a useEffect cleanup, whatever it was tearing down, an event listener, a subscription, a timer, now leaks: it keeps running after the component unmounts or the effect re-runs, and can fire against stale state.",
          },
        ],
      },
      {
        number: 9,
        title: "Refactor filing status hook",
        file: "useFilingStatus.ts",
        purpose: "Fix an effect that looked like it was over-firing.",
        headline: "Warning → review flagged items before merging",
        findings: [
          {
            severity: "warning",
            file: "useFilingStatus.ts",
            reason: "Blast radius: 3 files (3 transitive), called by RefundStatusTicker.tsx, App.tsx, main.tsx",
          },
          {
            severity: "warning",
            file: "useFilingStatus.ts",
            reason:
              "A hook's dependency array shrank (1 → 0 entries). If the removed dependency is still referenced inside the hook, it now closes over a stale value instead of reacting to changes — a common source of bugs that only show up intermittently.",
          },
        ],
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
        purpose: "Add a local dev default so new engineers don't need to set up .env immediately.",
        headline: "High risk → merging this rotates credentials in `env.ts`; verify CI/CD still has access",
        findings: [
          {
            severity: "blocker",
            file: "env.ts",
            reason: "Stripe key committed to source as a literal string; rotate this credential and read it from env instead",
          },
        ],
      },
      {
        number: 7,
        title: "Add debug logging for gateway integration issue",
        file: "paymentGateway.ts",
        purpose: "Add logging to help debug an integration issue during the gateway rollout.",
        headline: "High risk → merging this rotates credentials in `paymentGateway.ts`; verify CI/CD still has access",
        findings: [
          {
            severity: "blocker",
            file: "paymentGateway.ts",
            reason: "apikey credential committed to source for the first time; verify this is not a production secret",
          },
        ],
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
        purpose: "Reduce dependency friction by loosening a few overly strict version pins.",
        headline: "Warning → review flagged items before merging",
        findings: [{ severity: "warning", file: "package.json", reason: "may fail at runtime without surfacing an error" }],
      },
      {
        number: 23,
        title: "Remove unused multer dependency",
        file: "package.json",
        purpose: "Dead-dependency cleanup after an audit of package.json.",
        headline: "Warning → review flagged items before merging",
        findings: [{ severity: "warning", file: "package.json", reason: "may fail at runtime without surfacing an error" }],
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
        purpose: "Relax validation that looked overly strict and was rejecting valid input.",
        headline: "High risk → merging this will break external consumers on deploy",
        findings: [{ severity: "blocker", file: "schemas.ts", reason: ".email() removed from a Zod schema field. Data that used to fail this validation can now pass through and reach the handler." }],
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
        purpose: "Simplify a cleanup script that resets draft filings for a test user.",
        headline: "High risk → merging this alters a table schema; downstream services may fail",
        findings: [
          { severity: "blocker", file: "seed.ts", reason: "Database schema change. Services querying affected tables may need updates." },
          {
            severity: "blocker",
            file: "seed.ts",
            reason:
              "deleteMany() called with no filter — this deletes every row in the table, not a scoped subset. If a where clause was meant to be here, its absence won't throw; it'll just wipe the table.",
          },
        ],
      },
    ],
  },
]

const totalPRs = categories.reduce((n, c) => n + c.prs.length, 0)

// ── PR card, tabbed: what the PR is + what Memor said, vs. the raw diff ─────

function PRCard({ pr }: { pr: PR }) {
  const [tab, setTab] = useState<"pr" | "diff">("pr")
  const diff = prDiffs[pr.number]

  const tabButtonClass = (t: "pr" | "diff") =>
    `border-b-2 px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] transition-colors ${
      tab === t
        ? "border-black text-black"
        : "border-transparent text-[#8A8A8A] hover:text-black"
    }`

  const changedFiles = diff ? filesInDiff(diff) : [pr.file]
  const fileBadge = changedFiles.length > 1 ? `${changedFiles.length} files` : pr.file

  return (
    <div className="overflow-hidden rounded border border-[#E5E5E5]">
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
          {fileBadge}
        </span>
      </div>

      <div className="flex border-b border-[#E5E5E5] bg-white">
        <button onClick={() => setTab("pr")} className={tabButtonClass("pr")}>
          What is the PR
        </button>
        <button onClick={() => setTab("diff")} className={tabButtonClass("diff")}>
          The diff
        </button>
      </div>

      {tab === "pr" ? (
        <div className="space-y-4 bg-[#F5F5F5] p-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.1em] text-[#8A8A8A]">
              What this PR is for
            </p>
            <p className="text-[12.5px] leading-6 text-[#0A0A0A]">{pr.purpose}</p>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-[#8A8A8A]">
              Files changed
            </p>
            <div className="flex flex-wrap gap-1.5">
              {changedFiles.map((f) => (
                <span
                  key={f}
                  className="rounded border border-[#E5E5E5] bg-white px-2 py-0.5 text-[11px] text-[#0A0A0A]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <GitHubComment pr={pr} fileCount={changedFiles.length} />
        </div>
      ) : diff ? (
        <DiffView diff={diff} />
      ) : (
        <div className="bg-white p-4">
          <p className="text-[12px] text-[#8A8A8A]">Diff unavailable.</p>
        </div>
      )}

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
  )
}

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
            We built TaxLedger specifically for engineering teams at Clear, to show the categories and
            types of impact detection Memor can actually analyze. TaxLedger is a real, working Indian
            tax-filing app — Express, TypeScript, Prisma, Zod, React. {totalPRs} PRs below, across{" "}
            {categories.length} categories.
          </p>
        </section>

        {/* SIDEBAR + CONTENT */}
        <section className="grid grid-cols-1 gap-8 pb-24 md:grid-cols-[240px_1fr]">
          {/* SIDEBAR */}
          <nav className="md:sticky md:top-24 md:self-start">
            <p className="mb-3 px-3 text-[10px] uppercase tracking-[0.1em] text-[#8A8A8A] md:px-0">
              Analysis categories
            </p>
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
                <PRCard key={pr.number} pr={pr} />
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
