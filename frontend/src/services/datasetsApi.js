import { API_BASE } from '../config.js'
import { readApiErrorDetail } from '../utils/apiError.js'

const BASE = `${API_BASE}/datasets`

function q(pitchDemo, useIntegratedReal) {
  const p = new URLSearchParams()
  if (pitchDemo) p.set('pitch_demo', 'true')
  if (useIntegratedReal) p.set('use_integrated_real', 'true')
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function listPools() {
  const res = await fetch(`${BASE}/pools`)
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function createPool(name, description = '') {
  const res = await fetch(`${BASE}/pools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function getPool(poolId) {
  const res = await fetch(`${BASE}/pools/${encodeURIComponent(poolId)}`)
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function deletePool(poolId) {
  const res = await fetch(`${BASE}/pools/${encodeURIComponent(poolId)}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error(await readApiErrorDetail(res))
}

export async function uploadPoolFiles(poolId, fileList) {
  const form = new FormData()
  for (const f of fileList) {
    form.append('files', f)
  }
  const res = await fetch(`${BASE}/pools/${encodeURIComponent(poolId)}/files`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function importPoolFromPath(poolId, sourceDirectory) {
  const res = await fetch(`${BASE}/pools/${encodeURIComponent(poolId)}/import-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_directory: sourceDirectory }),
  })
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function snapshotPool(poolId, label = '') {
  const res = await fetch(`${BASE}/pools/${encodeURIComponent(poolId)}/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  })
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function analyzePoolFile(poolId, fileId, pitchDemo, useIntegratedReal) {
  const res = await fetch(
    `${BASE}/pools/${encodeURIComponent(poolId)}/files/${encodeURIComponent(fileId)}/analyze${q(pitchDemo, useIntegratedReal)}`,
    { method: 'POST' },
  )
  if (!res.ok) {
    throw new Error(await readApiErrorDetail(res))
  }
  return res.json()
}

export async function startBatchJob(poolId, fileIds, pitchDemo, useIntegratedReal) {
  const res = await fetch(`${BASE}/pools/${encodeURIComponent(poolId)}/batch-jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_ids: fileIds,
      pitch_demo: pitchDemo,
      use_integrated_real: useIntegratedReal,
    }),
  })
  if (!res.ok) {
    throw new Error(await readApiErrorDetail(res))
  }
  const data = await res.json()
  return data.job_id
}

export async function getBatchJobStatus(jobId) {
  const res = await fetch(`${BASE}/batch-jobs/${encodeURIComponent(jobId)}`)
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}

export async function getBatchJobResult(jobId, fileId) {
  const res = await fetch(`${BASE}/batch-jobs/${encodeURIComponent(jobId)}/results/${encodeURIComponent(fileId)}`)
  if (!res.ok) throw new Error(await readApiErrorDetail(res))
  return res.json()
}
