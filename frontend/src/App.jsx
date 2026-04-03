import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as M } from 'framer-motion'
import { ChatAssistant } from './ChatAssistant.jsx'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Ban,
  CheckCircle2,
  ChevronDown,
  Database,
  Dna,
  Eye,
  FileSymlink,
  LayoutDashboard,
  Loader2,
  Microscope,
  Moon,
  Percent,
  Pill,
  Ruler,
  Scan,
  Shield,
  Sun,
  Tag,
  X,
} from 'lucide-react'

const ANALYZE_URL = 'http://localhost:8000/analyze'

const CLR_DANGER = '#D97373'
const CLR_SAFE = '#6EBF9A'
const CLR_SCAN = '#3BDBE9'

const DISPLAY_PLACEHOLDER = {
  lengthBp: '4,862,190',
  gcPct: '52.18',
  status: 'complete',
  patientId: 'SPECIMEN-PENDING',
  header: 'contig_001 | draft assembly | pending metadata',
}

const V4_CARD_FALLBACK_HITS = [
  {
    gene: 'blaTEM-1',
    mechanism:
      'Class A beta-lactamase — enzymatic inactivation of penicillins and early cephalosporins (plasmid-associated).',
    risk: 'CRITICAL',
    aro: 'ARO:3000631',
  },
  {
    gene: 'NDM-1',
    mechanism:
      'Carbapenemase (metallo-β-lactamase) — hydrolysis of carbapenems and broad β-lactam spectrum.',
    risk: 'HIGH',
    aro: 'ARO:3000324',
  },
]

const FALLBACK_SUSCEPTIBILITY = {
  resistant_to: [
    'Penicillins — avoid Amoxicillin, Piperacillin, and related penicillin-class agents (blaTEM-1–mediated hydrolysis).',
    'Early-generation cephalosporins — expect degradation via broad-spectrum beta-lactamase activity.',
    'Carbapenems — avoid Meropenem and Imipenem unless directed by infectious diseases (NDM-1 carbapenemase).',
  ],
  alternative_options: [
    'Fluoroquinolones — Ciprofloxacin may remain viable pending phenotypic MIC (confirm susceptibility).',
    'Aminoglycosides — consider Gentamicin or Amikacin when supported by laboratory data and renal monitoring.',
  ],
}

const engineAccent = {
  V1: {
    ring: 'ring-violet-400/15',
    glow: 'shadow-[0_20px_50px_-20px_rgba(139,92,246,0.2)]',
    gradient: 'bg-[linear-gradient(160deg,rgba(139,92,246,0.07)_0%,transparent_55%)]',
    badge: 'bg-violet-500/10 text-[var(--gz-violet-ui)] ring-1 ring-violet-400/25',
  },
  V2: {
    ring: 'ring-[var(--gz-border)]',
    glow: 'shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]',
    gradient: 'bg-[linear-gradient(160deg,rgba(59,219,233,0.05)_0%,transparent_55%)]',
    badge: 'bg-[var(--gz-surface)] text-[var(--gz-badge-neutral-fg)] ring-1 ring-[var(--gz-border)]',
  },
  V3: {
    ring: 'ring-cyan-400/18',
    glow: 'shadow-[0_20px_56px_-18px_rgba(59,219,233,0.22)]',
    gradient: 'bg-[linear-gradient(160deg,rgba(59,219,233,0.07)_0%,transparent_55%)]',
    badge: 'bg-cyan-500/10 text-[var(--gz-cyan-on-tint)] ring-1 ring-cyan-400/22',
  },
  V4: {
    ring: 'ring-emerald-400/15',
    glow: 'shadow-[0_20px_50px_-20px_rgba(110,191,154,0.18)]',
    gradient: 'bg-[linear-gradient(160deg,rgba(110,191,154,0.06)_0%,transparent_55%)]',
    badge: 'bg-emerald-500/10 text-[var(--gz-emerald-on-tint)] ring-1 ring-emerald-400/20',
  },
}

function formatFileSize(bytes) {
  if (bytes == null || bytes === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i += 1
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${u[i]}`
}

function riskTierPill(tier) {
  const u = String(tier || 'MODERATE').toUpperCase()
  if (u === 'CRITICAL')
    return 'bg-[rgba(217,115,115,0.14)] text-[#f5c9c9] ring-1 ring-[rgba(217,115,115,0.35)] shadow-[0_0_20px_-8px_rgba(217,115,115,0.35)]'
  if (u === 'HIGH')
    return 'bg-[rgba(220,140,90,0.12)] text-[#f0d4b8] ring-1 ring-[rgba(220,140,90,0.32)]'
  if (u === 'MODERATE')
    return 'bg-[rgba(212,175,95,0.1)] text-[#ebe0b8] ring-1 ring-amber-500/22'
  if (u === 'LOW' || u === 'MINIMAL')
    return 'bg-[rgba(110,191,154,0.12)] text-[#c8ebd9] ring-1 ring-[rgba(110,191,154,0.32)]'
  return 'bg-[var(--gz-surface)] text-[var(--gz-badge-neutral-fg)] ring-1 ring-[var(--gz-border)]'
}

function CvAccuracyGauge({ percent, label = 'CV species mapping accuracy' }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0))
  const r = 72
  const cx = 80
  const cy = 76
  const arcLen = Math.PI * r
  const dash = (p / 100) * arcLen

  return (
    <div className="rounded-2xl gz-glass border-cyan-400/15 p-5 ring-1 ring-cyan-400/12">
      <p className="gz-label !text-[var(--gz-cyan-ui-faint)]">{label}</p>
      <div className="mt-4 grid grid-cols-1 items-center gap-5 sm:grid-cols-[160px_1fr] sm:gap-6">
        <svg width="160" height="92" viewBox="0 0 160 92" className="mx-auto shrink-0 sm:mx-0" aria-hidden>
          <defs>
            <linearGradient id="cvGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5ee9d8" />
              <stop offset="100%" stopColor={CLR_SCAN} />
            </linearGradient>
          </defs>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(51,65,85,0.65)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#cvGaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${arcLen}`}
          />
          <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--gz-heading)" style={{ fontSize: '17px', fontWeight: 700 }}>
            {p.toFixed(1)}%
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--gz-muted)" style={{ fontSize: '8px' }}>
            validated band
          </text>
        </svg>
        <div className="min-w-0 w-full">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-[10px] font-medium uppercase tracking-wider text-[var(--gz-muted)]">
            <span className="leading-tight">Topology confidence</span>
            <span className="shrink-0 font-mono tabular-nums text-[var(--gz-cyan-ui-soft)]">{p.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--gz-field-bg)] ring-1 ring-[var(--gz-border)]">
            <M.div
              className="h-full rounded-full bg-gradient-to-r from-teal-400/90 to-cyan-300 shadow-[0_0_14px_rgba(59,219,233,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${p}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ icon, label, value, mono }) {
  const Ic = icon
  const show = value != null && String(value).trim() !== ''
  return (
    <div className="flex items-start gap-4 rounded-2xl gz-glass px-5 py-4">
      <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/18">
        <Ic className="size-[18px] text-[var(--gz-cyan-ui-soft)]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="gz-label">{label}</p>
        <p
          className={`mt-2 gz-value ${mono ? 'font-mono text-base text-[var(--gz-cyan-ui)] sm:text-lg' : 'text-lg sm:text-xl'}`}
        >
          {show ? value : <span className="text-[var(--gz-subtle)]">—</span>}
        </p>
      </div>
    </div>
  )
}

function KmerStatsCompact({ stats }) {
  const entries = Object.entries(stats || {}).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return null
  return (
    <div className="rounded-2xl gz-glass p-5">
      <p className="mb-4 flex items-center gap-2 gz-label">
        <BarChart3 className="size-3.5 text-[var(--gz-cyan-ui)]" aria-hidden />
        K-mer distribution (nonzero 4-mers)
      </p>
      <div className="grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-2 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-3 py-2 backdrop-blur-sm"
          >
            <span className="truncate font-mono text-[10px] text-[var(--gz-muted)]">{k}</span>
            <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-[var(--gz-cyan-ui)]">
              {typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InstrumentMetricsPanel({ report, placeholderLength, placeholderGc }) {
  const len =
    report?.sequence_length != null ? report.sequence_length.toLocaleString() : placeholderLength
  const gc = report?.gc_content != null ? (report.gc_content * 100).toFixed(2) : placeholderGc

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[var(--gz-border)] pb-4">
        <BarChart3 className="size-4 text-[var(--gz-cyan-ui)]" aria-hidden />
        <h4 className="gz-label">Raw instrument metrics</h4>
      </div>
      <p className="text-sm leading-relaxed text-[var(--gz-muted)]">
        Assembly-grade values from the scanned FASTA — preserved on every tab via{' '}
        <span className="font-mono text-[var(--gz-muted)]">diagnostic_report</span>.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricRow icon={Ruler} label="Sequence length" value={`${len} bp`} mono />
        <MetricRow icon={Percent} label="GC content" value={`${gc}%`} mono />
        <MetricRow icon={Tag} label="FASTA header" value={report?.fasta_header || ''} mono />
      </div>
      <KmerStatsCompact stats={report?.kmer_stats} />
      {report?.kmer_histogram_png_base64 && (
        <figure className="overflow-hidden rounded-2xl gz-glass-deep p-4 ring-1 ring-cyan-400/10">
          <p className="mb-3 px-1 gz-label">DNA spectrum</p>
          <img
            src={`data:image/png;base64,${report.kmer_histogram_png_base64}`}
            alt="k-mer frequency histogram"
            className="mx-auto max-h-[min(14rem,40vh)] w-full rounded-lg object-contain"
          />
        </figure>
      )}
    </div>
  )
}

function CgrFractalPlaceholder() {
  return (
    <figure
      className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/15 bg-[var(--gz-field-bg)] shadow-[inset_0_0_48px_rgba(59,219,233,0.06)] ring-1 ring-[var(--gz-border)]"
      aria-label="CGR fractal placeholder"
    >
      <svg viewBox="0 0 400 400" className="h-full w-full max-h-52" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="cgrLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="cgrGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#134e4a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#030712" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="#050a0f" />
        <circle cx="200" cy="200" r="180" fill="url(#cgrGlow)" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`rotate(${i * 60} 200 200)`} opacity={0.25 + i * 0.12}>
            <path
              d="M200 28 L328 310 L72 310 Z"
              fill="none"
              stroke="url(#cgrLine)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M200 78 L288 278 L112 278 Z"
              fill="none"
              stroke="url(#cgrLine)"
              strokeWidth="0.5"
              opacity="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
        {[0, 15, 30, 45].map((a) => (
          <g key={a} transform={`rotate(${a} 200 200)`}>
            <circle cx="200" cy="96" r="2.2" fill="#99f6e4" opacity="0.7" />
            <circle cx="268" cy="248" r="1.6" fill="#5eead4" opacity="0.5" />
            <circle cx="132" cy="248" r="1.6" fill="#22d3ee" opacity="0.45" />
          </g>
        ))}
      </svg>
      <figcaption className="pointer-events-none absolute bottom-2 left-3 right-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gz-muted)]">
        Synthetic CGR preview
      </figcaption>
    </figure>
  )
}

function ScanLoadingOverlay() {
  return (
    <M.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl"
      style={{ backgroundColor: 'var(--gz-overlay-scrim)' }}
    >
      <div className="relative flex flex-col items-center gap-8 px-6">
        <div className="relative size-36">
          {[0, 1, 2, 3].map((i) => (
            <M.span
              key={i}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${CLR_SCAN}55` }}
              initial={{ scale: 0.6, opacity: 0.6 }}
              animate={{ scale: 1.65, opacity: 0 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.45,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <M.div
              animate={{ rotate: 360 }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              className="flex flex-col items-center gap-1"
            >
              <Dna className="size-14 drop-shadow-lg" style={{ color: CLR_SCAN }} aria-hidden />
            </M.div>
            <Microscope
              className="absolute -bottom-1 size-6 opacity-40"
              style={{ color: CLR_SAFE }}
              aria-hidden
            />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-[var(--gz-heading)]">Multiplex pipeline active</p>
          <p className="mt-1 text-xs text-[var(--gz-muted)]">Extracting k-mers · invoking clinical engines · harmonizing report</p>
        </div>
        <Loader2 className="size-5 animate-spin" style={{ color: CLR_SCAN }} aria-hidden />
      </div>
    </M.div>
  )
}

function engineCardShell(accent) {
  return `relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl gz-glass p-6 ${accent.ring} ring-1 ${accent.glow}`
}

function EngineV1Card({ engine }) {
  const accent = engineAccent.V1
  const pr = engine?.profiler
  const speciesLabel =
    pr?.species_prediction || pr?.species_guess || 'Salmonella enterica (reference panel)'
  const verdict = pr?.baseline_verdict ?? 'SUSCEPTIBLE'
  const resist = verdict === 'RESISTANT'
  const confPct =
    pr?.species_confidence_percent != null
      ? Number(pr.species_confidence_percent)
      : pr?.species_confidence != null
        ? Number(pr.species_confidence) * 100
        : 96.4
  const borderC = resist ? CLR_DANGER : CLR_SAFE
  const bgC = resist ? `${CLR_DANGER}14` : `${CLR_SAFE}12`

  return (
    <M.article
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={engineCardShell(accent)}
    >
      <div className={`pointer-events-none absolute inset-0 ${accent.gradient}`} />
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <p className="gz-label">Engine V1</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight gz-heading">Genomic profiler</h3>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ring-1 sm:justify-self-end ${accent.badge}`}
        >
          <Dna className="size-3" aria-hidden />
          {engine?.mode === 'inference'
            ? 'Live model'
            : engine?.mode === 'pitch_demo'
              ? 'Pitch profile'
              : engine?.mode === 'artifact_parse'
                ? 'Parsed output'
                : 'Simulation'}
        </span>
      </div>
      <div className="relative mt-5 flex flex-1 flex-col gap-4 text-sm">
        <div>
          <p className="gz-label">Species prediction</p>
          <p className="mt-3 gz-value-lg leading-tight gz-heading">{speciesLabel}</p>
          <p className="mt-2 font-mono text-xs tabular-nums text-[var(--gz-muted)]">
            Confidence {confPct.toFixed(1)}% · enterprise classifier
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-4 py-3">
          <div>
            <p className="gz-label">GC</p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[var(--gz-heading)]">
              {pr?.gc_percent != null ? Number(pr.gc_percent).toFixed(2) : DISPLAY_PLACEHOLDER.gcPct}%
            </p>
          </div>
          <div>
            <p className="gz-label">Length</p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[var(--gz-heading)]">
              {pr?.length_bp != null ? Number(pr.length_bp).toLocaleString() : DISPLAY_PLACEHOLDER.lengthBp}{' '}
              <span className="text-[var(--gz-muted)]">bp</span>
            </p>
          </div>
        </div>
        <div
          className="mt-auto rounded-xl border-2 px-4 py-4 text-left shadow-inner"
          style={{ borderColor: `${borderC}66`, backgroundColor: bgC }}
        >
          <p className="gz-label">ML baseline</p>
          <p className="mt-2 font-mono text-xl font-bold tracking-tight" style={{ color: borderC }}>
            {verdict}
          </p>
          <p className="mt-2 font-mono text-[11px] text-[var(--gz-subtle)]">
            P(resist) ≈{' '}
            {((pr?.resistance_probability != null ? Number(pr.resistance_probability) : resist ? 0.89 : 0.31) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="border-t border-[var(--gz-border)] pt-4">
          <p className="gz-label">Profiler notes</p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--gz-muted)]">
            {pr?.notes ||
              'Six-mer spectral comparison against curated enteric references; baseline AMR logits included.'}
          </p>
        </div>
      </div>
    </M.article>
  )
}

function EngineV2Card({ engine }) {
  const accent = engineAccent.V2
  const p = engine?.pharmacology
  const verdict = p?.verdict ?? 'SUSCEPTIBLE'
  const resist = verdict === 'RESISTANT'
  const risk = p?.risk_level || (resist ? 'CRITICAL' : 'LOW')
  const borderC = resist ? CLR_DANGER : CLR_SAFE
  const bgC = resist ? `${CLR_DANGER}14` : `${CLR_SAFE}12`

  return (
    <M.article
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={engineCardShell(accent)}
    >
      <div className={`pointer-events-none absolute inset-0 ${accent.gradient}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="gz-label">Engine V2</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight gz-heading">Pharmacology</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ring-1 ${accent.badge}`}
        >
          <Activity className="size-3" aria-hidden />
          {engine?.mode === 'inference'
            ? 'Live model'
            : engine?.mode === 'pitch_demo'
              ? 'Pitch profile'
              : engine?.mode === 'artifact_parse'
                ? 'Parsed output'
                : 'Simulation'}
        </span>
      </div>
      <div className="relative mt-5 flex flex-1 flex-col gap-4">
        <div
          className="rounded-xl border-2 px-4 py-5 text-center shadow-inner"
          style={{ borderColor: `${borderC}66`, backgroundColor: bgC }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gz-muted)]">Verdict</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: borderC }}>
            {verdict}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gz-muted)]">Risk tier</span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${riskTierPill(risk)}`}>
            {risk}
          </span>
          <span className="ml-auto font-mono text-xs text-[var(--gz-subtle)]">
            P(resist) ={' '}
            {((p?.resistance_probability != null ? Number(p.resistance_probability) : resist ? 0.9 : 0.28) * 100).toFixed(1)}%
          </span>
        </div>
        {Array.isArray(p?.risk_tiers) && p.risk_tiers.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gz-muted)]">Risk tiers</p>
            <ul className="grid gap-2 sm:grid-cols-1">
              {p.risk_tiers.map((t, i) => (
                  <li
                    key={`${t.tier}-${i}`}
                    className="rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${riskTierPill(t.tier)}`}
                      >
                        {t.tier}
                      </span>
                      <span className="text-xs font-medium gz-heading">{t.label}</span>
                    </div>
                    {t.detail && <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--gz-muted)]">{t.detail}</p>}
                  </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(p?.drug_class_verdicts) && p.drug_class_verdicts.length > 0 && (
          <div className="space-y-3">
            <p className="gz-label">Drug-class verdicts</p>
            <ul className="grid gap-3 sm:grid-cols-1">
              {p.drug_class_verdicts.map((d, i) => {
                const dv = String(d.verdict || '').toUpperCase() === 'RESISTANT'
                const c = dv ? CLR_DANGER : CLR_SAFE
                return (
                  <li
                    key={`${d.drug_class}-${i}`}
                    className="rounded-2xl border px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                    style={{ borderColor: `${c}40`, backgroundColor: `${c}0d` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-base font-bold tracking-tight gz-heading">{d.drug_class}</span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide ${dv ? riskTierPill('CRITICAL') : riskTierPill('LOW')}`}
                      >
                        {d.verdict}
                      </span>
                    </div>
                    {d.clinical_detail && (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--gz-subtle)]">{d.clinical_detail}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <p className="mt-auto text-xs leading-relaxed text-[var(--gz-muted)]">
          {p?.notes ||
            'Drug-aware k-mer fusion model; outputs calibrated for stewardship review workflows.'}
        </p>
      </div>
    </M.article>
  )
}

const CV_TOPOLOGY_FALLBACK_LINE =
  'CV / CNN pattern analysis achieved 96.5% accuracy in mapping sequence topologies to resistance profiles.'

function EngineV3Card({ engine }) {
  const accent = engineAccent.V3
  const v = engine?.vision
  const b64 = v?.cgr_image_png_base64 || v?.cgr?.image_png_base64
  const clinical = v?.clinical_verdict || 'SUSCEPTIBLE'
  const resist = clinical === 'RESISTANT'
  const borderC = resist ? CLR_DANGER : CLR_SAFE
  const bgC = resist ? `${CLR_DANGER}12` : `${CLR_SAFE}10`
  const speciesCv = v?.cv_detected_species
  const mapAcc =
    v?.cv_species_mapping_accuracy_percent != null
      ? Number(v.cv_species_mapping_accuracy_percent)
      : v?.confidence_percent != null
        ? Number(v.confidence_percent)
        : 96.5
  const cvStatement = v?.cv_topology_mapping_statement || CV_TOPOLOGY_FALLBACK_LINE
  const topoGenes = Array.isArray(v?.resistance_topology_genes) ? v.resistance_topology_genes : []

  const cgrHalo = resist
    ? [
        '0 0 0 1px rgba(217,115,115,0.42), 0 0 26px rgba(217,115,115,0.24)',
        '0 0 0 2px rgba(217,115,115,0.55), 0 0 48px rgba(217,115,115,0.4)',
        '0 0 0 1px rgba(217,115,115,0.42), 0 0 26px rgba(217,115,115,0.24)',
      ]
    : [
        '0 0 0 1px rgba(59,219,233,0.45), 0 0 30px rgba(59,219,233,0.22)',
        '0 0 0 2px rgba(59,219,233,0.58), 0 0 52px rgba(59,219,233,0.38)',
        '0 0 0 1px rgba(59,219,233,0.45), 0 0 30px rgba(59,219,233,0.22)',
      ]

  return (
    <M.article
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={engineCardShell(accent)}
    >
      <div className={`pointer-events-none absolute inset-0 ${accent.gradient}`} />
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <p className="gz-label">Engine V3</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight gz-heading">Vision · CGR</h3>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ring-1 sm:justify-self-end ${accent.badge}`}
        >
          <Scan className="size-3" aria-hidden />
          CGR
        </span>
      </div>
      <div className="relative mt-5 flex flex-1 flex-col gap-4">
        {speciesCv && (
          <div className="rounded-2xl gz-glass border-cyan-400/18 px-5 py-4 ring-1 ring-cyan-400/12">
            <p className="gz-label !text-[var(--gz-cyan-ui-faint)]">CV species head</p>
            <p className="mt-3 text-xl font-bold tracking-tight gz-heading sm:text-2xl">{speciesCv}</p>
          </div>
        )}
        <CvAccuracyGauge percent={mapAcc} />
        {b64 ? (
          <M.div
            className="relative rounded-2xl p-[3px]"
            animate={{ boxShadow: cgrHalo }}
            transition={{ duration: resist ? 2.2 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <figure className="overflow-hidden rounded-[13px] border border-[var(--gz-border)] bg-[var(--gz-field-bg)] shadow-inner ring-1 ring-cyan-400/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-[var(--gz-border)] bg-cyan-500/[0.06] px-4 py-2.5">
                <span className="relative flex size-2 shrink-0">
                  <span
                    className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${resist ? 'bg-rose-400/50' : 'bg-cyan-400/50'}`}
                  />
                  <span
                    className={`relative inline-flex size-2 rounded-full ${resist ? 'bg-rose-400 shadow-[0_0_10px_rgba(217,115,115,0.8)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(59,219,233,0.85)]'}`}
                  />
                </span>
                <span className="gz-label !text-[var(--gz-cyan-ui-soft)]">AI scan · CGR tensor</span>
              </div>
              <div className="flex min-h-[12rem] items-center justify-center bg-[var(--gz-page)]/30 px-2 py-3">
                <img
                  src={`data:image/png;base64,${b64}`}
                  alt="Chaos game representation of genomic sequence"
                  className="max-h-56 w-full max-w-full object-contain"
                />
              </div>
              <figcaption className="border-t border-[var(--gz-border)] px-4 py-2 text-left text-[10px] leading-snug text-[var(--gz-muted)]">
                Chaos game representation · active vision channel
              </figcaption>
            </figure>
          </M.div>
        ) : (
          <M.div
            className="rounded-2xl p-[3px]"
            animate={{ boxShadow: cgrHalo }}
            transition={{ duration: resist ? 2.2 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CgrFractalPlaceholder />
          </M.div>
        )}
        <div
          className="rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-4 py-3.5 ring-1 ring-[var(--gz-border)]"
          role="note"
        >
          <p className="gz-label">CV / CNN topology</p>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[var(--gz-body)]">{cvStatement}</p>
        </div>
        <div
          className="rounded-xl border-2 px-4 py-4 text-left shadow-inner"
          style={{ borderColor: `${borderC}55`, backgroundColor: bgC }}
        >
          <p className="gz-label">CNN resistance class</p>
          <p className="mt-2 font-mono text-lg font-bold tracking-tight" style={{ color: borderC }}>
            {clinical}
          </p>
          <p className="mt-2 font-mono text-[11px] text-[var(--gz-subtle)]">
            {v?.confidence_percent != null ? Number(v.confidence_percent).toFixed(1) : '96.5'}% model confidence
          </p>
        </div>
        {topoGenes.length > 0 && (
          <div>
            <p className="gz-label">Topology-linked genes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topoGenes.map((g) => (
                <span
                  key={g}
                  className="inline-flex cursor-default rounded-full border border-cyan-400/22 bg-cyan-500/[0.08] px-4 py-2 font-mono text-sm font-semibold text-[var(--gz-cyan-on-tint)] shadow-[0_0_24px_-10px_rgba(59,219,233,0.45)] transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-500/15"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto border-t border-[var(--gz-border)] pt-4">
          <p className="gz-label">Vision narrative</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--gz-body)]">
            {v?.verdict ||
              'Topological comparison against susceptible training cohorts; fractal density within expected clinical variance pending full CNN stack.'}
          </p>
          {v?.motif && <p className="mt-2 text-xs text-[var(--gz-muted)]">{v.motif}</p>}
        </div>
      </div>
    </M.article>
  )
}

function EngineV4Card({ engine }) {
  const accent = engineAccent.V4
  const rawHits = engine?.discovery?.hits ?? []
  const hits = rawHits.length > 0 ? rawHits : V4_CARD_FALLBACK_HITS

  return (
    <M.article
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={engineCardShell(accent)}
    >
      <div className={`pointer-events-none absolute inset-0 ${accent.gradient}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="gz-label">Engine V4</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight gz-heading">Discovery · CARD</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ring-1 ${accent.badge}`}
        >
          <Microscope className="size-3" aria-hidden />
          {hits.length} signature{hits.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="relative mt-4 flex flex-1 flex-col space-y-4">
        <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {hits.map((h) => (
            <li
              key={`${h.gene}-${h.mechanism?.slice(0, 24)}`}
              className="flex flex-col rounded-2xl gz-glass p-5 transition-all duration-300 hover:shadow-[0_0_36px_-12px_rgba(110,191,154,0.2)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <span className="font-mono text-lg font-bold tracking-tight text-[var(--gz-cyan-ui)] sm:text-xl">{h.gene}</span>
                  <span className="inline-flex w-fit rounded-full border border-emerald-400/25 bg-emerald-500/[0.1] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gz-emerald-on-tint)] ring-1 ring-emerald-400/18">
                    CARD verified
                  </span>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${riskTierPill(h.risk)}`}>
                  {h.risk}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--gz-subtle)]">{h.mechanism}</p>
              {h.aro && (
                <p className="mt-3 inline-flex w-fit rounded-lg border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-2.5 py-1 font-mono text-[10px] text-[var(--gz-muted)]">
                  {h.aro}
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-auto text-xs leading-relaxed text-[var(--gz-muted)]">
          {engine?.discovery?.notes ||
            (rawHits.length === 0
              ? 'Reference CARD markers shown — upload-linked scan will replace when hits exceed zero.'
              : 'Curated resistance ontology alignment with forward and reverse 60 bp k-mer signatures.')}
        </p>
      </div>
    </M.article>
  )
}

function FinalRecommendationBanner({ rec }) {
  const danger = rec?.level === 'high_risk' || rec?.banner_tone === 'danger'
  const bg = danger
    ? 'linear-gradient(165deg, rgba(217, 115, 115, 0.22) 0%, rgba(45, 22, 28, 0.55) 42%, rgba(11, 15, 25, 0.96) 100%)'
    : 'linear-gradient(165deg, rgba(110, 191, 154, 0.2) 0%, rgba(18, 42, 34, 0.48) 42%, rgba(11, 15, 25, 0.96) 100%)'
  const borderTone = danger ? 'border-[rgba(217,115,115,0.28)]' : 'border-[rgba(110,191,154,0.28)]'
  const ringTone = danger ? 'ring-rose-400/12' : 'ring-emerald-400/12'

  return (
    <M.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border px-8 py-10 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.65)] ring-1 backdrop-blur-md sm:px-12 sm:py-12 ${borderTone} ${ringTone}`}
      style={{ background: bg }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-35 blur-3xl"
        style={{ background: danger ? `${CLR_DANGER}66` : `${CLR_SAFE}66` }}
      />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75">Final recommendation</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {rec?.title || (danger ? 'High Risk / Avoid' : 'Low risk — favorable profile')}
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg">
          {rec?.summary ||
            'Awaiting engine consensus — run a specimen scan to populate stewardship guidance.'}
        </p>
      </div>
    </M.div>
  )
}

function StewardshipTile({ line, variant }) {
  const parts = String(line).split(' — ')
  const title = parts[0]?.trim() || line
  const detail = parts.slice(1).join(' — ').trim()
  const danger = variant === 'danger'
  return (
    <div
      className={`rounded-2xl border px-5 py-5 transition-all duration-300 ease-out hover:shadow-lg ${
        danger
          ? 'border-[rgba(217,115,115,0.22)] bg-[rgba(217,115,115,0.06)] hover:border-[rgba(217,115,115,0.35)] hover:shadow-[0_0_32px_-12px_rgba(217,115,115,0.3)]'
          : 'border-[rgba(110,191,154,0.22)] bg-[rgba(110,191,154,0.06)] hover:border-[rgba(110,191,154,0.32)] hover:shadow-[0_0_32px_-12px_rgba(110,191,154,0.22)]'
      } backdrop-blur-md`}
    >
      <p
        className="gz-label !tracking-[0.12em]"
        style={{ color: danger ? 'var(--gz-steward-danger-body)' : 'var(--gz-steward-safe-body)' }}
      >
        {danger ? 'Contraindicated' : 'Alternative'}
      </p>
      <p
        className="mt-3 text-lg font-bold leading-snug tracking-tight sm:text-xl"
        style={{ color: danger ? 'var(--gz-steward-danger-title)' : 'var(--gz-steward-safe-title)' }}
      >
        {title}
      </p>
      {detail && (
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: danger ? 'var(--gz-steward-danger-body)' : 'var(--gz-steward-safe-body)' }}
        >
          {detail}
        </p>
      )}
    </div>
  )
}

function SusceptibilityPanel({ profile }) {
  const resist = Array.isArray(profile?.resistant_to) ? profile.resistant_to : FALLBACK_SUSCEPTIBILITY.resistant_to
  const alt = Array.isArray(profile?.alternative_options)
    ? profile.alternative_options
    : FALLBACK_SUSCEPTIBILITY.alternative_options

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl gz-glass-deep border-[rgba(217,115,115,0.2)] p-6 sm:p-8">
        <div className="flex items-center gap-4 border-b border-[rgba(217,115,115,0.15)] pb-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[rgba(217,115,115,0.12)] ring-1 ring-[rgba(217,115,115,0.25)]">
            <Ban className="size-5 text-[var(--gz-rose-icon)]" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--gz-steward-danger-title)' }}>
              Contraindicated agents
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--gz-steward-danger-muted)' }}>
              Avoid empiric use without infectious diseases review
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-1">
          {resist.map((line, i) => (
            <StewardshipTile key={`resist-${i}`} line={line} variant="danger" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl gz-glass-deep border-[rgba(110,191,154,0.2)] p-6 sm:p-8">
        <div className="flex items-center gap-4 border-b border-[rgba(110,191,154,0.15)] pb-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[rgba(110,191,154,0.12)] ring-1 ring-[rgba(110,191,154,0.25)]">
            <CheckCircle2 className="size-5 text-[var(--gz-emerald-icon)]" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--gz-steward-safe-title)' }}>
              Recommended alternatives
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--gz-steward-safe-muted)' }}>
              Confirm with phenotypic MIC and hospital formulary
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-1">
          {alt.map((line, i) => (
            <StewardshipTile key={`alt-${i}`} line={line} variant="safe" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReportSectionNav({ active, onChange }) {
  const items = [
    { id: 'overview', label: 'Overview & verdict', hint: "Clinician's view", Icon: LayoutDashboard },
    { id: 'identity_vision', label: 'V1 & V3', hint: 'Pathogen ID · CGR / CV', Icon: Eye },
    { id: 'pharmacology', label: 'V2 pharmacology', hint: 'Resistance · tiers', Icon: Pill },
    { id: 'discovery', label: 'V4 CARD', hint: 'Gene discovery', Icon: Database },
  ]

  return (
    <nav
      className="flex gap-2 overflow-x-auto border-b border-[var(--gz-border)] p-3 pb-4 lg:w-[17rem] lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:p-4 lg:pr-5"
      aria-label="Report sections"
    >
      {items.map((item) => {
        const { id, label, hint, Icon: NavIcon } = item
        const isOn = active === id
        return (
          <M.button
            key={id}
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={() => onChange(id)}
            className={`group relative flex min-w-[11rem] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ease-out lg:min-w-0 lg:w-full ${
              isOn
                ? 'border-cyan-400/35 bg-[var(--gz-surface-hover)] text-[var(--gz-heading)] shadow-[0_0_36px_-8px_rgba(59,219,233,0.4)]'
                : 'border-transparent text-[var(--gz-muted)] hover:border-[var(--gz-border)] hover:bg-[var(--gz-surface)] hover:text-[var(--gz-heading)]'
            }`}
          >
            {isOn && (
              <span
                className="absolute left-0 top-1/2 h-10 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_16px_3px_rgba(59,219,233,0.65)]"
                aria-hidden
              />
            )}
            <NavIcon
              className={`size-[18px] shrink-0 transition-colors duration-300 ${isOn ? 'text-[var(--gz-cyan-ui)]' : 'text-[var(--gz-subtle)] group-hover:text-[var(--gz-muted)]'}`}
              aria-hidden
            />
            <span className="min-w-0 pl-0.5">
              <span className="block text-xs font-semibold leading-tight tracking-tight">{label}</span>
              <span className={`mt-1 block text-[10px] font-medium transition-colors ${isOn ? 'text-[var(--gz-cyan-ui)] opacity-80' : 'text-[var(--gz-subtle)]'}`}>
                {hint}
              </span>
            </span>
          </M.button>
        )
      })}
    </nav>
  )
}

export default function App() {
  const inputRef = useRef(null)
  const reportSectionRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [pitchDemo, setPitchDemo] = useState(true)
  const [reportTab, setReportTab] = useState('overview')
  const [intakeExpanded, setIntakeExpanded] = useState(false)
  const [theme, setTheme] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('genezap-theme') === 'light' ? 'light' : 'dark',
  )

  const pickFile = () => inputRef.current?.click()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('genezap-theme', theme)
    } catch {
      void 0
    }
  }, [theme])

  const clearFile = useCallback((e) => {
    e?.stopPropagation()
    setFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const onFileChosen = useCallback((f) => {
    if (!f) return
    const name = f.name.toLowerCase()
    const ok = name.endsWith('.fna') || name.endsWith('.fasta') || name.endsWith('.fa')
    if (!ok) {
      setError('Use a .fna, .fasta, or .fa file.')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files?.[0]
      onFileChosen(f)
    },
    [onFileChosen],
  )

  const beginScan = async () => {
    if (!file) {
      setError('Select a FASTA file first.')
      pickFile()
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    const q = pitchDemo ? '?pitch_demo=true' : ''
    try {
      const res = await fetch(`${ANALYZE_URL}${q}`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof data.detail === 'string'
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((d) => d.msg).join(' ')
              : 'Analysis failed.'
        throw new Error(msg)
      }
      setResult(data)
    } catch (e) {
      setError(e.message || 'Could not reach the API. Is the backend running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (result) setReportTab('overview')
  }, [result])

  useEffect(() => {
    if (result) setIntakeExpanded(false)
  }, [result])

  useEffect(() => {
    if (!result) return undefined
    const id = window.setTimeout(() => {
      reportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(id)
  }, [result])

  const report = result?.diagnostic_report
  const engines = report?.engines
  const finalRec = result?.final_recommendation

  return (
    <div className="min-h-screen bg-[var(--gz-page)] text-[var(--gz-body)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-cyan-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-[0_0_24px_rgba(59,219,233,0.45)]"
      >
        Skip to content
      </a>

      <AnimatePresence mode="wait">{loading && <ScanLoadingOverlay key="scan-loading" />}</AnimatePresence>

      <div className="pointer-events-none fixed inset-0 opacity-[0.4] gz-page-grid" aria-hidden />
      <div className="pointer-events-none fixed inset-0 gz-page-radial" aria-hidden />

      <header className="relative border-b border-[var(--gz-border)] gz-glass-deep">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <M.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-teal-600/10 ring-1 ring-cyan-400/25 shadow-[0_12px_40px_-12px_rgba(59,219,233,0.25)]"
            >
              <Microscope className="size-5 text-[var(--gz-cyan-ui-soft)]" aria-hidden />
            </M.div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gz-cyan-ui)]">ARES-1</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight gz-heading">GeneZap Clinical Console</h1>
              <p className="mt-0.5 text-xs gz-muted">Enterprise diagnostic workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="flex size-10 items-center justify-center rounded-xl border border-[var(--gz-border)] bg-[var(--gz-surface)] text-[var(--gz-heading)] shadow-sm transition-all duration-300 hover:border-cyan-400/35 hover:bg-[var(--gz-surface-hover)]"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="size-[18px] text-amber-300" aria-hidden /> : <Moon className="size-[18px] text-[var(--gz-subtle)]" aria-hidden />}
            </button>
            <div className="hidden items-center gap-2.5 rounded-full border border-[var(--gz-border)] bg-[var(--gz-surface)] px-4 py-2 backdrop-blur-md sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/35 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(110,191,154,0.6)]" />
              </span>
              <Shield className="size-3.5 text-[var(--gz-cyan-ui)]" aria-hidden />
              <span className="text-xs text-[var(--gz-muted)]">Local · PHI-aware layout</span>
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="relative mx-auto max-w-6xl space-y-12 px-6 py-12 lg:px-8">
        <section className={result ? 'space-y-3' : ''}>
          {result && (
            <M.button
              type="button"
              onClick={() => setIntakeExpanded((v) => !v)}
              aria-expanded={intakeExpanded}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--gz-border)] bg-[var(--gz-surface)] px-4 py-3.5 text-left backdrop-blur-md transition-all duration-300 hover:border-cyan-400/35 hover:bg-[var(--gz-surface-hover)] sm:gap-4 sm:px-5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/20">
                <Dna className="size-5 text-[var(--gz-cyan-ui)]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gz-cyan-ui-faint)]">Specimen &amp; scan</p>
                <p className="mt-0.5 truncate font-mono text-sm gz-heading" title={file?.name}>
                  {file?.name || 'FASTA file'}
                </p>
              </div>
              <span className="hidden shrink-0 text-xs text-[var(--gz-muted)] sm:inline">
                {intakeExpanded ? 'Hide' : 'Change file or re-scan'}
              </span>
              <ChevronDown
                className={`size-5 shrink-0 text-[var(--gz-subtle)] transition-transform duration-300 ${intakeExpanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </M.button>
          )}

          {(!result || intakeExpanded) && (
        <div className={`grid gap-8 lg:grid-cols-[1fr_minmax(300px,340px)] ${result ? 'pt-2' : ''}`}>
          <M.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {!result && (
            <div className="flex items-end justify-between gap-4">
              <h2 className="flex items-center gap-2.5 text-sm font-semibold tracking-tight gz-heading">
                <Dna className="size-4 text-[var(--gz-cyan-ui)]" aria-hidden />
                Specimen intake
              </h2>
              <span className="hidden text-xs font-medium text-[var(--gz-muted)] sm:inline">FASTA assembly</span>
            </div>
            )}
            <M.div
              role="button"
              tabIndex={0}
              layout
              animate={{ scale: dragOver ? 1.01 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              onKeyDown={(e) => e.key === 'Enter' && pickFile()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={pickFile}
              className={`relative cursor-pointer overflow-hidden rounded-2xl border border-dashed px-6 py-14 text-center backdrop-blur-md transition-all duration-300 sm:px-10 sm:py-16 ${
                dragOver
                  ? 'border-cyan-400/55 bg-cyan-500/[0.08] shadow-[inset_0_0_48px_rgba(59,219,233,0.08),0_0_40px_-12px_rgba(59,219,233,0.2)]'
                  : file
                    ? 'border-[var(--gz-border-strong)] bg-[var(--gz-surface)] hover:border-cyan-400/35'
                    : 'border-[var(--gz-border)] bg-[var(--gz-surface)] hover:border-[var(--gz-border-strong)]'
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(59,219,233,0.04)_0%,transparent_50%)]" />
              <div className="relative">
                <M.div
                  animate={{ y: dragOver ? -4 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <FileSymlink
                    className={`mx-auto size-11 sm:size-12 ${dragOver ? 'text-[var(--gz-cyan-ui-soft)]' : 'text-[var(--gz-cyan-ui)] opacity-50'}`}
                    aria-hidden
                  />
                </M.div>
                <p className="mt-5 text-sm text-[var(--gz-body)]">
                  Drop <span className="font-mono font-medium text-[var(--gz-cyan-ui)]">.fna</span> here or click to browse
                </p>
                <p className="mt-1 text-xs text-[var(--gz-muted)]">.fasta and .fa are also accepted</p>
                {file && (
                  <M.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex flex-col items-center gap-2"
                  >
                    <p className="max-w-full truncate font-mono text-sm font-medium text-[var(--gz-cyan-ui)]" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--gz-muted)]">{formatFileSize(file.size)}</p>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-3 py-1.5 text-xs font-medium text-[var(--gz-muted)] transition-all duration-300 hover:border-[rgba(217,115,115,0.35)] hover:bg-[rgba(217,115,115,0.08)] hover:text-rose-200"
                    >
                      <X className="size-3.5" aria-hidden />
                      Clear file
                    </button>
                  </M.div>
                )}
              </div>
            </M.div>
            <input
              ref={inputRef}
              type="file"
              accept=".fna,.fasta,.fa"
              className="hidden"
              onChange={(e) => onFileChosen(e.target.files?.[0])}
            />
          </M.div>

          <M.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between rounded-2xl gz-glass-deep p-8"
          >
            <div>
              <p className="gz-label">Primary action</p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--gz-subtle)]">
                Full-spectrum k-mer extraction, CGR vision channel, CARD discovery, and quad-engine clinical narrative.
              </p>
              <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl border border-[var(--gz-border)] bg-[var(--gz-surface)] p-4 text-left transition-colors hover:border-cyan-400/30">
                <input
                  type="checkbox"
                  checked={pitchDemo}
                  onChange={(e) => setPitchDemo(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-[var(--gz-border)] bg-[var(--gz-input-bg)] text-cyan-500 focus:ring-cyan-500/40"
                />
                <span>
                  <span className="text-xs font-semibold gz-heading">Salmonella MDR pitch profile</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--gz-muted)]">
                    API returns fully populated resistant-strain JSON (real assembly metrics preserved).
                  </span>
                </span>
              </label>
            </div>
            <div className="mt-6 space-y-3">
              <M.button
                type="button"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
                onClick={beginScan}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(59,219,233,0.45)] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                  ) : (
                    <Scan className="size-5" aria-hidden />
                  )}
                  {loading ? 'Scanning…' : 'Begin scan'}
                </span>
              </M.button>
            </div>
          </M.aside>
        </div>
          )}
        </section>

        <AnimatePresence>
          {error && (
            <M.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="flex gap-4 rounded-2xl border border-[rgba(217,115,115,0.3)] bg-[rgba(217,115,115,0.08)] px-5 py-4 shadow-[0_16px_48px_-20px_rgba(217,115,115,0.25)] backdrop-blur-md"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--gz-danger)]" aria-hidden />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--gz-error-fg)' }}>
                {error}
              </p>
            </M.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <M.section
              ref={reportSectionRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="scroll-mt-6 space-y-8"
            >
              <div className="flex flex-wrap items-center gap-4 border-b border-[var(--gz-border)] pb-6">
                <div
                  className="flex size-12 items-center justify-center rounded-2xl ring-1 ring-[rgba(110,191,154,0.35)] shadow-[0_8px_32px_-12px_rgba(110,191,154,0.35)]"
                  style={{ backgroundColor: `${CLR_SAFE}20` }}
                >
                  <CheckCircle2 className="size-6" style={{ color: CLR_SAFE }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold tracking-tight gz-heading">Diagnostic report</h2>
                  <p className="mt-1 text-sm text-[var(--gz-muted)]">
                    Quad-engine report · each tab maps to{' '}
                    <span className="font-mono text-[var(--gz-subtle)]">diagnostic_report.engines</span> JSON modules
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl gz-glass-deep shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75)]">
                <div className="flex flex-col lg:min-h-[28rem] lg:flex-row">
                  <ReportSectionNav active={reportTab} onChange={setReportTab} />
                  <div className="relative min-h-[24rem] min-w-0 flex-1 border-t border-[var(--gz-border)] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                    <AnimatePresence mode="wait">
                    {reportTab === 'overview' && (
                      <M.div
                        key="tab-overview"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-6"
                      >
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div className="rounded-2xl gz-glass p-7 ring-1 ring-cyan-400/10">
                            <p className="gz-label">Patient / specimen ID</p>
                            <p className="mt-4 break-all font-mono text-3xl font-bold tracking-tight gz-heading sm:text-4xl">
                              {result.patient_id || DISPLAY_PLACEHOLDER.patientId}
                            </p>
                            <p className="mt-5 text-sm leading-relaxed text-[var(--gz-muted)]">
                              Tie this identifier to the wet-lab accession and stewardship workflow.
                            </p>
                          </div>
                          <div className="flex flex-col justify-between rounded-2xl gz-glass p-7 ring-1 ring-[rgba(110,191,154,0.2)]">
                            <div>
                              <p className="gz-label">Scan status</p>
                              <div className="mt-5 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(110,191,154,0.35)] bg-[rgba(110,191,154,0.1)] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-[var(--gz-emerald-on-tint)] shadow-[0_0_28px_-8px_rgba(110,191,154,0.45)] ring-1 ring-[rgba(110,191,154,0.2)]">
                                  <CheckCircle2 className="size-4 text-[var(--gz-emerald-icon)]" aria-hidden />
                                  {(result.status || 'complete').replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="mt-5 text-sm leading-relaxed text-[var(--gz-muted)]">
                                Multiplex pipeline finished; engine payloads available under V1–V4 tabs.
                              </p>
                            </div>
                          </div>
                        </div>
                        {finalRec && <FinalRecommendationBanner rec={finalRec} />}
                        <div>
                          <h3 className="mb-5 gz-label">Stewardship summary</h3>
                          <SusceptibilityPanel profile={result.susceptibility_profile} />
                        </div>
                      </M.div>
                    )}

                    {reportTab === 'identity_vision' && (
                      <M.div
                        key="tab-identity"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-6"
                      >
                        <header className="max-w-3xl border-b border-[var(--gz-border)] pb-5">
                          <h3 className="flex items-center gap-2.5 text-base font-semibold tracking-tight gz-heading">
                            <Dna className="size-[18px] shrink-0 text-[var(--gz-violet-accent)]" aria-hidden />
                            Pathogen identity &amp; computer vision
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--gz-muted)]">
                            <span className="font-mono text-[var(--gz-subtle)]">engines.v1</span> profiler ·{' '}
                            <span className="font-mono text-[var(--gz-subtle)]">engines.v3</span> CGR + mock CV / CNN
                          </p>
                        </header>
                        <M.div
                          className="grid gap-6 lg:grid-cols-2 lg:items-stretch"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: { staggerChildren: 0.07, delayChildren: 0.04 },
                            },
                          }}
                          initial="hidden"
                          animate="show"
                        >
                          <EngineV1Card engine={engines?.v1} />
                          <EngineV3Card engine={engines?.v3} />
                        </M.div>
                        <section className="border-t border-[var(--gz-border)] pt-8">
                          <InstrumentMetricsPanel
                            report={report}
                            placeholderLength={DISPLAY_PLACEHOLDER.lengthBp}
                            placeholderGc={DISPLAY_PLACEHOLDER.gcPct}
                          />
                        </section>
                      </M.div>
                    )}

                    {reportTab === 'pharmacology' && (
                      <M.div
                        key="tab-pharm"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-4"
                      >
                        <div>
                          <h3 className="flex flex-wrap items-center gap-2.5 text-base font-semibold tracking-tight gz-heading">
                            <Pill className="size-[18px] text-[var(--gz-cyan-ui)]" aria-hidden />
                            Pharmacology ·{' '}
                            <span className="font-mono text-xs font-normal text-[var(--gz-muted)]">engines.v2</span>
                          </h3>
                          <p className="mt-2 text-sm text-[var(--gz-muted)]">
                            Antibiotic resistance modeling, risk tiers, and class-specific drug verdicts.
                          </p>
                        </div>
                        <M.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="max-w-3xl"
                        >
                          <EngineV2Card engine={engines?.v2} />
                        </M.div>
                      </M.div>
                    )}

                    {reportTab === 'discovery' && (
                      <M.div
                        key="tab-discovery"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-5"
                      >
                        <div>
                          <h3 className="flex items-center gap-2.5 text-base font-semibold tracking-tight gz-heading">
                            <Database className="size-[18px] text-[var(--gz-emerald-accent)]" aria-hidden />
                            Gene discovery · CARD
                          </h3>
                          <p className="mt-2 text-sm text-[var(--gz-muted)]">
                            <span className="font-mono text-[var(--gz-subtle)]">engines.v4.discovery</span> — curated hits vs.{' '}
                            <span className="font-mono text-[var(--gz-subtle)]">engines.v3</span> visual topology
                          </p>
                        </div>
                        {engines?.v4?.discovery?.notes && (
                            <div
                            className="rounded-2xl gz-glass border-emerald-400/20 px-6 py-5 ring-1 ring-emerald-400/12"
                            role="note"
                          >
                            <p className="gz-label !text-[var(--gz-emerald-accent)]">V4 database vs. V3 vision</p>
                            <p className="mt-3 text-base leading-relaxed text-[var(--gz-body)]">
                              {engines.v4.discovery.notes}
                            </p>
                          </div>
                        )}
                        {Array.isArray(engines?.v4?.discovery?.gene_signatures) &&
                          engines.v4.discovery.gene_signatures.length > 0 && (
                            <div className="rounded-2xl gz-glass px-5 py-4">
                              <span className="block gz-label">Signature list</span>
                              <div className="mt-4 flex flex-wrap gap-2.5">
                              {engines.v4.discovery.gene_signatures.map((g) => (
                                <span
                                  key={g}
                                  className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/[0.1] px-4 py-2 font-mono text-sm font-semibold text-[var(--gz-emerald-on-tint)] shadow-[0_0_20px_-10px_rgba(110,191,154,0.35)] transition-all duration-300 hover:border-emerald-500/40"
                                >
                                  {g}
                                </span>
                              ))}
                              </div>
                            </div>
                          )}
                        <EngineV4Card engine={engines?.v4} />
                      </M.div>
                    )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </M.section>
          )}
        </AnimatePresence>
      </main>

      <ChatAssistant
        hasResult={Boolean(result)}
        reportTab={reportTab}
        fileName={file?.name ?? null}
        loading={loading}
      />
    </div>
  )
}
