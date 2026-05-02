const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface ApiError {
  status: number
  detail: string
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

function parseDetail(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) return raw.map((e: any) => e.msg ?? String(e)).join(', ')
  return 'Request failed'
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  contentType: 'json' | 'form' = 'json',
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let bodyInit: BodyInit | undefined
  if (body !== undefined) {
    if (contentType === 'form') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      bodyInit = new URLSearchParams(body as Record<string, string>).toString()
    } else {
      headers['Content-Type'] = 'application/json'
      bodyInit = JSON.stringify(body)
    }
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: bodyInit })

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err: ApiError = { status: res.status, detail: parseDetail(data?.detail) }
    throw err
  }

  return data as T
}

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: form })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err: ApiError = { status: res.status, detail: parseDetail(data?.detail) }
    throw err
  }
  return data as T
}

export const api = {
  get:      <T>(path: string) => request<T>('GET', path),
  post:     <T>(path: string, body?: unknown) => request<T>('POST', path, body, 'json'),
  postForm: <T>(path: string, body: Record<string, string>) => request<T>('POST', path, body, 'form'),
  patch:    <T>(path: string, body?: unknown) => request<T>('PATCH', path, body, 'json'),
  delete:   <T>(path: string) => request<T>('DELETE', path),
  postFile: <T>(path: string, file: File) => uploadFile<T>(path, file),
}
