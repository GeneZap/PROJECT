import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as M } from 'framer-motion'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'

const WELCOME =
  "I'm the GeneZap console assistant. Ask how to run a scan, what each engine tab shows, or about the pitch demo profile. I don't access PHI—answers are about this workspace only."

const QUICK_PROMPTS = [
  'How do I run a scan?',
  'What do V1–V4 mean?',
  'Pitch demo mode',
]

function replyFor(text, ctx) {
  const q = text.toLowerCase().trim()
  if (!q) return "Type a question or tap a quick prompt below."

  if (ctx.loading) {
    return 'A scan is in progress. When it finishes, your diagnostic report will appear below the intake area.'
  }

  if (/^(hi|hello|hey)\b/.test(q)) {
    return "Hello. I'm here to help you use this console—upload workflow, report tabs, and demo mode. What would you like to know?"
  }

  if (/scan|upload|fasta|\.fna|\.fa|file|begin scan/.test(q)) {
    return 'Choose a single FASTA assembly (.fna, .fasta, or .fa), then click **Begin scan**. The API must be running locally (default port 8000). After a successful run, the report scrolls into view and specimen intake collapses—expand it anytime to change files or re-scan.'
  }

  if (/v1|profiler|species|identity(?!\s*vision)/.test(q)) {
    return '**V1 (Genomic profiler)** predicts species and a baseline resistance verdict from sequence features. Find it under **V1 & V3** next to the vision panel.'
  }

  if (/v2|pharmacology|drug|tier|verdict/.test(q)) {
    return '**V2 Pharmacology** models drug-class resistance, risk tiers, and narrative notes. Open the **V2 pharmacology** tab after you have results.'
  }

  if (/v3|cgr|vision|computer vision|cnn|tensor/.test(q)) {
    return '**V3** shows chaos game representation (CGR) imagery and CV-style readouts when the API provides them—useful for explaining the “vision channel” in your pitch.'
  }

  if (/v4|card|discovery|gene|signature/.test(q)) {
    return '**V4 CARD discovery** lists curated resistance gene hits (or reference markers when the demo profile is active). See the **V4 CARD** tab.'
  }

  if (/tab|overview|report|section|nav/.test(q)) {
    return `Use the left report nav: **Overview** (stewardship summary), **V1 & V3**, **V2 pharmacology**, **V4 CARD**. You're currently on **${ctx.reportTab.replace(/_/g, ' ')}** (when a report exists).`
  }

  if (/pitch|demo|salmonella|mdr/.test(q)) {
    return '**Salmonella MDR pitch profile** (checkbox before scan) asks the API for a fully populated resistant-strain-style JSON while still using your real assembly metrics—ideal for judge demos.'
  }

  if (/theme|dark|light|mode/.test(q)) {
    return 'Use the sun/moon button in the header to switch **light** and **dark** clinical themes. Your choice is saved in the browser.'
  }

  if (/api|backend|8000|localhost|error|connect|failed/.test(q)) {
    return 'The UI talks to `POST /analyze` on the backend (default `http://localhost:8000`). If you see connection errors, start the FastAPI server and check the port matches `ANALYZE_URL` in the frontend code.'
  }

  if (/stewardship|resistant|alternative|contraindicated/.test(q)) {
    return '**Overview** shows contraindicated agents vs. suggested alternatives from `susceptibility_profile` (or demo fallbacks). Always confirm with lab MICs and ID—this is a hackathon UI, not a medical device.'
  }

  if (ctx.hasResult && /result|done|complete|next/.test(q)) {
    return 'You already have a report loaded. Explore the tabs for engines V1–V4, or expand **Specimen & scan** at the top to run another file.'
  }

  if (ctx.fileName && !ctx.hasResult && /ready|next|what now/.test(q)) {
    return `You selected **${ctx.fileName}**. Click **Begin scan** when the backend is up.`
  }

  return "I can explain scanning, each engine tab, pitch demo mode, theming, and API setup. Try rephrasing, or use a quick prompt. For clinical decisions, rely on your lab and physicians—not this assistant."
}

function formatReplyMarkdownish(s) {
  const parts = s.split(/\*\*(.+?)\*\*/g)
  return parts.map((chunk, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-[var(--gz-heading)]">
        {chunk}
      </strong>
    ) : (
      <span key={i}>{chunk}</span>
    ),
  )
}

export function ChatAssistant({ hasResult, reportTab, fileName, loading }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(() => [{ role: 'assistant', text: WELCOME }])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [messages, open, scrollToBottom])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = useCallback(
    (raw) => {
      const text = typeof raw === 'string' ? raw : input.trim()
      if (!text) return
      setInput('')
      setMessages((m) => [...m, { role: 'user', text }])
      const ctx = { hasResult, reportTab, fileName, loading }
      window.setTimeout(() => {
        const answer = replyFor(text, ctx)
        setMessages((m) => [...m, { role: 'assistant', text: answer }])
      }, 380)
    },
    [input, hasResult, reportTab, fileName, loading],
  )

  const onSubmit = (e) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[45] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <M.div
            key="panel"
            role="dialog"
            aria-label="GeneZap assistant chat"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-[var(--gz-border)] gz-glass-deep shadow-[0_24px_64px_-12px_rgba(0,0,0,0.45)] sm:w-[24rem]"
          >
            <div className="flex items-center justify-between border-b border-[var(--gz-border)] bg-[var(--gz-surface)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-cyan-400/25">
                  <Sparkles className="size-[18px] text-[var(--gz-cyan-ui)]" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold gz-heading">Assistant</p>
                  <p className="text-[10px] text-[var(--gz-muted)]">Workspace help · not clinical advice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-[var(--gz-muted)] transition-colors hover:bg-[var(--gz-surface-hover)] hover:text-[var(--gz-heading)]"
                aria-label="Close assistant"
              >
                <X className="size-4" />
              </button>
            </div>

            <div
              role="log"
              aria-live="polite"
              className="max-h-[min(18rem,42vh)] space-y-3 overflow-y-auto px-3 py-3"
            >
              {messages.map((msg, i) => (
                <div
                  key={`${i}-${msg.role}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[var(--gz-cyan-ui)] text-white shadow-md'
                        : 'border border-[var(--gz-border)] bg-[var(--gz-field-bg)] text-[var(--gz-body)]'
                    }`}
                  >
                    {msg.role === 'assistant' ? formatReplyMarkdownish(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-[var(--gz-border)] px-3 py-2">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--gz-muted)]">Quick prompts</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-[var(--gz-border)] bg-[var(--gz-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--gz-body)] transition-colors hover:border-cyan-400/35 hover:bg-[var(--gz-surface-hover)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this console…"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-input-bg)] px-3 py-2.5 text-sm text-[var(--gz-heading)] placeholder:text-[var(--gz-muted)] focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-md transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </M.div>
        )}
      </AnimatePresence>

      <M.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex size-14 items-center justify-center rounded-2xl border border-[var(--gz-border)] bg-gradient-to-br from-cyan-600 via-cyan-500 to-teal-600 text-white shadow-[0_12px_40px_-8px_rgba(59,219,233,0.55)] ring-2 ring-white/10"
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open GeneZap assistant'}
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
      </M.button>
    </div>
  )
}
