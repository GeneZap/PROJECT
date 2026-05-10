import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion as M } from 'framer-motion'
import { Database, FolderInput, Layers, Loader2, Play, RefreshCw, Upload, Lock } from 'lucide-react'
import * as api from '../../services/datasetsApi.js'

function formatBytes(n) {
  if (n == null || n === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let x = n
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024
    i += 1
  }
  return `${x < 10 && i > 0 ? x.toFixed(1) : Math.round(x)} ${u[i]}`
}

/**
 * Dataset pool UI: CRUD pools, multi-upload, server path import, file browser,
 * single-file analyze (same payload as POST /analyze), and async batch jobs.
 */
export function DatasetPoolPanel({
  pitchDemo,
  useIntegratedReal,
  onAnalysisResult,
  onError,
  onGlobalLoading,
}) {
  const [pools, setPools] = useState([])
  const [defaultPool, setDefaultPool] = useState(null)
  const [poolId, setPoolId] = useState('')
  const [detail, setDetail] = useState(null)
  const [loadingPools, setLoadingPools] = useState(false)
  const [newPoolName, setNewPoolName] = useState('My FASTA pool')
  const [importPath, setImportPath] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [batchJobId, setBatchJobId] = useState(null)
  const [batchStatus, setBatchStatus] = useState(null)
  const [batchPoll, setBatchPoll] = useState(false)
  const uploadInputRef = useRef(null)

  const refreshPools = useCallback(async () => {
    setLoadingPools(true)
    onError(null)
    try {
      // Load default public pool
      try {
        const defaultData = await api.getDefaultPool()
        setDefaultPool(defaultData)
      } catch (e) {
        console.warn('Default pool not available:', e)
      }

      // Load user pools
      const list = await api.listPools()
      setPools(list)
      setPoolId((prev) => prev || (list[0]?.pool_id ?? ''))
    } catch (e) {
      onError(e.message || 'Could not list dataset pools.')
    } finally {
      setLoadingPools(false)
    }
  }, [onError])

  const refreshDetail = useCallback(async () => {
    if (!poolId) {
      setDetail(null)
      return
    }
    try {
      // Handle default pool specially (don't call UUID-validated endpoints)
      const defaultPoolId = defaultPool?.pool_id || 'default-public-pool'
      if (poolId === defaultPoolId) {
        if (defaultPool) {
          setDetail(defaultPool)
        } else {
          // Reload default pool if not yet available
          const freshDefault = await api.getDefaultPool()
          setDefaultPool(freshDefault)
          setDetail(freshDefault)
        }
        setSelectedIds(new Set())
        return
      }
      // For user pools, fetch from API (only UUIDs allowed here)
      const d = await api.getPool(poolId)
      setDetail(d)
      setSelectedIds(new Set())
    } catch (e) {
      onError(e.message || 'Could not load pool.')
    }
  }, [poolId, defaultPool, onError])

  useEffect(() => {
    void refreshPools()
  }, [refreshPools])

  useEffect(() => {
    void refreshDetail()
  }, [refreshDetail])

  useEffect(() => {
    if (!batchJobId || !batchPoll) return undefined
    let cancelled = false
    const tick = async () => {
      try {
        const st = await api.getBatchJobStatus(batchJobId)
        if (cancelled) return
        setBatchStatus(st)
        if (st.status === 'completed' || st.status === 'failed') {
          setBatchPoll(false)
        }
      } catch {
        if (!cancelled) setBatchPoll(false)
      }
    }
    void tick()
    const t = window.setInterval(() => void tick(), 1200)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [batchJobId, batchPoll])

  const toggleSelect = (fid) => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (n.has(fid)) n.delete(fid)
      else n.add(fid)
      return n
    })
  }

  const selectAll = () => {
    if (!detail?.files?.length) return
    setSelectedIds(new Set(detail.files.map((f) => f.file_id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const onCreatePool = async () => {
    onError(null)
    try {
      const d = await api.createPool(newPoolName.trim() || 'Untitled pool', '')
      setPoolId(d.pool_id)
      await refreshPools()
      setDetail(d)
    } catch (e) {
      onError(e.message || 'Create pool failed.')
    }
  }

  const onUploadClick = () => uploadInputRef.current?.click()

  const onUploadFiles = async (e) => {
    const fl = e.target.files
    if (!fl?.length || !poolId) return
    onError(null)
    try {
      await api.uploadPoolFiles(poolId, Array.from(fl))
      await refreshDetail()
      await refreshPools()
    } catch (err) {
      onError(err.message || 'Upload failed.')
    }
    e.target.value = ''
  }

  const onImportPath = async () => {
    if (!poolId || !importPath.trim()) return
    onError(null)
    try {
      await api.importPoolFromPath(poolId, importPath.trim())
      setImportPath('')
      await refreshDetail()
      await refreshPools()
    } catch (e) {
      onError(e.message || 'Path import failed (enable GENEZAP_ALLOW_DATASET_PATH_IMPORT on server).')
    }
  }

  const onSnapshot = async () => {
    if (!poolId) return
    onError(null)
    try {
      const d = await api.snapshotPool(poolId, 'manual snapshot')
      setDetail(d)
      await refreshPools()
    } catch (e) {
      onError(e.message || 'Snapshot failed.')
    }
  }

  const onAnalyzeOne = async (fileId, displayName) => {
    if (!poolId) return
    onError(null)
    onGlobalLoading?.(true)
    try {
      const data = await api.analyzePoolFile(poolId, fileId, pitchDemo, useIntegratedReal)
      onAnalysisResult(data, displayName)
    } catch (e) {
      onError(e.message || 'Analysis failed.')
    } finally {
      onGlobalLoading?.(false)
    }
  }

  const onAnalyzeSelected = async () => {
    const ids = [...selectedIds]
    if (!poolId || ids.length === 0) return
    if (ids.length === 1) {
      const f = detail?.files?.find((x) => x.file_id === ids[0])
      await onAnalyzeOne(ids[0], f?.original_filename || ids[0])
      return
    }
    onError(null)
    try {
      const jobId = await api.startBatchJob(poolId, ids, pitchDemo, useIntegratedReal)
      setBatchJobId(jobId)
      setBatchStatus({ job_id: jobId, status: 'pending', total: ids.length, completed: 0, failed: 0 })
      setBatchPoll(true)
    } catch (e) {
      onError(e.message || 'Could not start batch job.')
    }
  }

  const onViewBatchResult = async (fileId, displayName) => {
    if (!batchJobId) return
    onError(null)
    try {
      const data = await api.getBatchJobResult(batchJobId, fileId)
      onAnalysisResult(data, displayName)
    } catch (e) {
      onError(e.message || 'Could not load result.')
    }
  }

  const selectedList = useMemo(() => {
    if (!detail?.files) return []
    return detail.files.filter((f) => selectedIds.has(f.file_id))
  }, [detail, selectedIds])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight gz-heading">
          <Database className="size-4 text-[var(--gz-cyan-ui)]" aria-hidden />
          Dataset pool
        </h3>
        <button
          type="button"
          onClick={() => void refreshPools()}
          disabled={loadingPools}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-surface)] px-3 py-1.5 text-xs font-medium text-[var(--gz-muted)] hover:border-cyan-400/35 hover:text-[var(--gz-heading)] disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loadingPools ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-[var(--gz-border)] bg-[var(--gz-surface)] p-4 sm:grid-cols-2 sm:p-5">
        {/* Public Pool Section */}
        {defaultPool && (
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-400/20 p-4 sm:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">📚 Public Dataset Collection</p>
              <Lock className="size-3.5 text-cyan-400/60" aria-hidden />
            </div>
            <p className="text-xs text-[var(--gz-muted)] mb-3">
              {defaultPool.file_count} pre-loaded genomes, read-only
            </p>
            <button
              type="button"
              onClick={() => {
                setPoolId(defaultPool.pool_id || 'default-public-pool')
                setDetail(defaultPool)
                setSelectedIds(new Set())
              }}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                poolId === (defaultPool.pool_id || 'default-public-pool')
                  ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-200'
                  : 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              Use Public Pool ({defaultPool.file_count} genomes)
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label className="gz-label">Active pool</label>
          <select
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
            className="w-full rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-3 py-2.5 text-sm text-[var(--gz-heading)]"
          >
            <option value="">— Select —</option>
            {pools.map((p) => (
              <option key={p.pool_id} value={p.pool_id}>
                {p.name} ({p.file_count} files, v{p.manifest_version})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:justify-end">
          <label className="gz-label">New pool</label>
          <div className="flex flex-wrap gap-2">
            <input
              value={newPoolName}
              onChange={(e) => setNewPoolName(e.target.value)}
              className="min-w-[8rem] flex-1 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-3 py-2 text-sm"
              placeholder="Pool name"
            />
            <button
              type="button"
              onClick={() => void onCreatePool()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-[var(--gz-cyan-ui)]"
            >
              <Layers className="size-3.5" aria-hidden />
              Create
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-[var(--gz-border)] bg-[var(--gz-surface)] p-5">
          <p className="gz-label">Upload FASTA files</p>
          <p className="mt-1 text-xs text-[var(--gz-muted)]">Multi-select .fna / .fasta / .fa into the active pool.</p>
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            accept=".fna,.fasta,.fa"
            className="hidden"
            onChange={(e) => void onUploadFiles(e)}
          />
          <button
            type="button"
            onClick={onUploadClick}
            disabled={!poolId || poolId === (defaultPool?.pool_id || 'default-public-pool')}
            title={poolId === (defaultPool?.pool_id || 'default-public-pool') ? 'Cannot upload to public pool (read-only)' : ''}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] py-3 text-sm font-medium hover:border-cyan-400/35 disabled:opacity-45"
          >
            <Upload className="size-4" aria-hidden />
            Choose files…
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--gz-border)] bg-[var(--gz-surface)] p-5">
          <p className="gz-label flex items-center gap-2">
            <FolderInput className="size-3.5" aria-hidden />
            Import from server folder
          </p>
          <p className="mt-1 text-xs text-[var(--gz-muted)]">
            Copies FASTA from a path the API host can read. Set{' '}
            <span className="font-mono text-[var(--gz-subtle)]">GENEZAP_ALLOW_DATASET_PATH_IMPORT=1</span>.
          </p>
          <input
            value={importPath}
            onChange={(e) => setImportPath(e.target.value)}
            placeholder="e.g. D:\data\my_fastas"
            className="mt-3 w-full rounded-xl border border-[var(--gz-border)] bg-[var(--gz-field-bg)] px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            disabled={!poolId || !importPath.trim() || poolId === (defaultPool?.pool_id || 'default-public-pool')}
            title={poolId === (defaultPool?.pool_id || 'default-public-pool') ? 'Cannot import to public pool (read-only)' : ''}
            onClick={() => void onImportPath()}
            className="mt-3 w-full rounded-xl bg-[var(--gz-field-bg)] py-2.5 text-xs font-medium ring-1 ring-[var(--gz-border)] hover:ring-cyan-400/35 disabled:opacity-45"
          >
            Import directory
          </button>
        </div>
      </div>

      {detail && (
        <div className="overflow-hidden rounded-2xl border border-[var(--gz-border)] gz-glass">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gz-border)] px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gz-cyan-ui-faint)]">Pool contents</p>
              <p className="mt-0.5 font-mono text-sm text-[var(--gz-heading)]">
                {detail.name} · v{detail.manifest_version} · {detail.files.length} files
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onSnapshot()}
                className="rounded-lg border border-[var(--gz-border)] px-3 py-1.5 text-xs font-medium text-[var(--gz-muted)] hover:border-cyan-400/35"
              >
                Version snapshot
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg border border-[var(--gz-border)] px-3 py-1.5 text-xs font-medium text-[var(--gz-muted)] hover:border-cyan-400/35"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-[var(--gz-border)] px-3 py-1.5 text-xs font-medium text-[var(--gz-muted)] hover:border-cyan-400/35"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-[min(24rem,50vh)] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[var(--gz-surface)] text-[var(--gz-muted)]">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.files.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--gz-muted)]">
                      No files yet — upload or import from a server path.
                    </td>
                  </tr>
                )}
                {detail.files.map((f) => (
                  <tr key={f.file_id} className="border-t border-[var(--gz-border)]">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(f.file_id)}
                        onChange={() => toggleSelect(f.file_id)}
                        className="size-3.5 rounded border-[var(--gz-border)]"
                      />
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2 font-mono text-[var(--gz-cyan-ui)]" title={f.original_filename}>
                      {f.original_filename}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[var(--gz-muted)]">{formatBytes(f.size_bytes)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void onAnalyzeOne(f.file_id, f.original_filename)}
                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 px-2 py-1 text-[11px] font-semibold text-[var(--gz-cyan-ui)]"
                      >
                        <Play className="size-3" aria-hidden />
                        Run
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--gz-border)] px-4 py-3">
            <p className="text-xs text-[var(--gz-muted)]">
              {selectedList.length} selected
              {selectedList.length > 1 ? ' · batch runs in background' : ''}
            </p>
            <M.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={!selectedIds.size}
              onClick={() => void onAnalyzeSelected()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-45"
            >
              {selectedIds.size > 1 ? (
                <>
                  <Loader2 className={`size-3.5 ${batchPoll ? 'animate-spin' : ''}`} aria-hidden />
                  Batch analyze
                </>
              ) : (
                <>
                  <Play className="size-3.5" aria-hidden />
                  Analyze selection
                </>
              )}
            </M.button>
          </div>
        </div>
      )}

      {batchStatus && (
        <div className="rounded-2xl border border-[var(--gz-border)] bg-[var(--gz-surface)] p-4">
          <p className="gz-label">Batch job</p>
          <p className="mt-1 font-mono text-xs text-[var(--gz-muted)]">{batchStatus.job_id}</p>
          <p className="mt-2 text-sm text-[var(--gz-heading)]">
            Status: <span className="font-semibold">{batchStatus.status}</span> — {batchStatus.completed}/{batchStatus.total}{' '}
            done
            {batchStatus.failed ? `, ${batchStatus.failed} failed` : ''}
          </p>
          {batchStatus.errors?.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-rose-300">
              {batchStatus.errors.map((err, i) => (
                <li key={i}>
                  {err.file_id}: {err.detail}
                </li>
              ))}
            </ul>
          )}
          {batchStatus.status === 'completed' && selectedList.length > 1 && (
            <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-[var(--gz-border)] bg-[var(--gz-field-bg)] p-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--gz-muted)]">Open result</p>
              <div className="flex flex-wrap gap-1">
                {selectedList.map((f) => (
                  <button
                    key={f.file_id}
                    type="button"
                    onClick={() => void onViewBatchResult(f.file_id, f.original_filename)}
                    className="rounded-md border border-[var(--gz-border)] px-2 py-1 font-mono text-[10px] hover:border-cyan-400/40"
                  >
                    {f.original_filename}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
