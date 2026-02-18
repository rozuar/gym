import type { AuthResponse, User, Plan, Subscription, Discipline, ClassItem, Schedule, Booking, BookingWithUser, Instructor, Routine, UserResult, FeedEvent, WaitlistEntry, LeaderboardEntry, Payment, DashboardStats, TVSchedule } from '../types'

const BASE = '/api/v1'

let accessToken = localStorage.getItem('access_token') || ''
let refreshToken = localStorage.getItem('refresh_token') || ''

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  accessToken = ''
  refreshToken = ''
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function getAccessToken() { return accessToken }

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  }
  if (body) opts.body = JSON.stringify(body)

  let res = await fetch(`${BASE}${path}`, opts)

  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      opts.headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }
      res = await fetch(`${BASE}${path}`, opts)
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }

  if (res.status === 204) return {} as T
  return res.json()
}

function get<T>(path: string) { return request<T>('GET', path) }
function post<T>(path: string, body?: unknown) { return request<T>('POST', path, body) }
function put<T>(path: string, body?: unknown) { return request<T>('PUT', path, body) }
function del<T>(path: string, body?: unknown) { return request<T>('DELETE', path, body) }

// Auth
export const auth = {
  login: (email: string, password: string) => post<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => post<AuthResponse>('/auth/register', { name, email, password }),
}

// Users
export const users = {
  me: () => get<User>('/users/me'),
  updateMe: (data: Partial<User>) => put<User>('/users/me', data),
  list: (limit = 100, offset = 0) => get<{ users: User[] }>(`/users?limit=${limit}&offset=${offset}`),
  getById: (id: number) => get<User>(`/users/${id}`),
  update: (id: number, data: Partial<User>) => put<User>(`/users/${id}`, data),
  remove: (id: number) => del(`/users/${id}`),
  addInvitation: (id: number, count: number) => post(`/users/${id}/invitation`, { count }),
}

// Plans
export const plans = {
  list: () => get<{ plans: Plan[] }>('/plans'),
  create: (data: Partial<Plan>) => post<Plan>('/plans', data),
  update: (id: number, data: Partial<Plan>) => put<Plan>(`/plans/${id}`, data),
  remove: (id: number) => del(`/plans/${id}`),
}

// Payments
export const payments = {
  create: (data: { user_id: number; plan_id: number; payment_method: string; proof_image_url?: string }) => post<Payment>('/payments', data),
  mine: () => get<{ payments: Payment[] }>('/payments/me'),
  listAll: (limit = 100, offset = 0) => get<{ payments: Payment[] }>(`/payments?limit=${limit}&offset=${offset}`),
  mySubscription: () => get<Subscription>('/subscriptions/me'),
}

// Disciplines
export const disciplines = {
  list: () => get<{ disciplines: Discipline[] }>('/disciplines'),
  create: (data: Partial<Discipline>) => post<Discipline>('/disciplines', data),
  update: (id: number, data: Partial<Discipline>) => put<Discipline>(`/disciplines/${id}`, data),
  remove: (id: number) => del(`/disciplines/${id}`),
}

// Classes
export const classes = {
  list: (disciplineId?: number) => get<{ classes: ClassItem[] }>(`/classes${disciplineId ? `?discipline_id=${disciplineId}` : ''}`),
  getById: (id: number) => get<ClassItem>(`/classes/${id}`),
  create: (data: Partial<ClassItem>) => post<ClassItem>('/classes', data),
  update: (id: number, data: Partial<ClassItem>) => put<ClassItem>(`/classes/${id}`, data),
  remove: (id: number) => del(`/classes/${id}`),
}

// Schedules
export const schedules = {
  list: (from?: string, to?: string, includeCancelled = false) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (includeCancelled) params.set('include_cancelled', 'true')
    return get<{ schedules: Schedule[] }>(`/schedules?${params}`)
  },
  generate: (start?: string) => post(`/schedules/generate${start ? `?start=${start}` : ''}`),
  cancel: (id: number) => post(`/schedules/${id}/cancel`),
  attendance: (id: number) => get<{ schedule: Schedule; bookings: BookingWithUser[] }>(`/schedules/${id}/attendance`),
}

// Bookings
export const bookings = {
  create: (scheduleId: number) => post<Booking>(`/schedules/${scheduleId}/book`),
  mine: (upcoming = false) => get<{ bookings: Booking[] }>(`/bookings/me${upcoming ? '?upcoming=true' : ''}`),
  cancel: (id: number) => del(`/bookings/${id}`),
  checkin: (id: number) => post(`/bookings/${id}/checkin`),
  beforePhoto: (id: number, photoUrl: string) => post(`/bookings/${id}/before-photo`, { photo_url: photoUrl }),
}

// Waitlist
export const waitlist = {
  join: (scheduleId: number) => post<WaitlistEntry>(`/schedules/${scheduleId}/waitlist`),
  leave: (scheduleId: number) => del(`/schedules/${scheduleId}/waitlist`),
  get: (scheduleId: number) => get<{ waitlist: WaitlistEntry[] }>(`/schedules/${scheduleId}/waitlist`),
}

// Routines
export const routines = {
  list: (type?: string, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (type) params.set('type', type)
    return get<{ routines: Routine[] }>(`/routines?${params}`)
  },
  listCustom: (userId?: number) => get<{ routines: Routine[] }>(`/routines/custom${userId ? `?user_id=${userId}` : ''}`),
  getById: (id: number) => get<Routine>(`/routines/${id}`),
  create: (data: Partial<Routine>) => post<Routine>('/routines', data),
  update: (id: number, data: Partial<Routine>) => put<Routine>(`/routines/${id}`, data),
  remove: (id: number) => del(`/routines/${id}`),
  assignToSchedule: (scheduleId: number, routineId: number, notes?: string) => post(`/schedules/${scheduleId}/routine`, { routine_id: routineId, notes }),
  getScheduleRoutine: (scheduleId: number) => get<{ routine: Routine | null }>(`/schedules/${scheduleId}/routine`),
  removeScheduleRoutine: (scheduleId: number) => del(`/schedules/${scheduleId}/routine`),
}

// Results
export const results = {
  log: (data: { routine_id: number; class_schedule_id?: number; score: string; notes?: string; rx: boolean }) => post<UserResult>('/results', data),
  mine: (limit = 50, offset = 0) => get<{ results: UserResult[] }>(`/results/me?limit=${limit}&offset=${offset}`),
  update: (id: number, data: { score?: string; notes?: string; rx?: boolean }) => put<UserResult>(`/results/${id}`, data),
  remove: (id: number) => del(`/results/${id}`),
  history: (routineId: number) => get<{ history: UserResult[] }>(`/routines/${routineId}/history`),
  userResults: (userId: number, limit = 50, offset = 0) => get<{ results: UserResult[] }>(`/users/${userId}/results?limit=${limit}&offset=${offset}`),
}

// PRs
export const prs = {
  mine: () => get<{ prs: UserResult[] }>('/prs/me'),
}

// Feed
export const feed = {
  get: (limit = 30, offset = 0) => get<{ events: FeedEvent[] }>(`/feed?limit=${limit}&offset=${offset}`),
}

// Fistbumps
export const fistbumps = {
  create: (resultId: number) => post('/fistbump', { result_id: resultId }),
  remove: (resultId: number) => del('/fistbump', { result_id: resultId }),
}

// Leaderboard
export const leaderboard = {
  get: (scheduleId: number) => get<{ leaderboard: LeaderboardEntry[] }>(`/schedules/${scheduleId}/leaderboard`),
}

// Instructors
export const instructors = {
  list: () => get<{ instructors: Instructor[] }>('/instructors'),
  getById: (id: number) => get<Instructor>(`/instructors/${id}`),
  create: (data: Partial<Instructor>) => post<Instructor>('/instructors', data),
  update: (id: number, data: Partial<Instructor>) => put<Instructor>(`/instructors/${id}`, data),
  remove: (id: number) => del(`/instructors/${id}`),
}

// Stats
export const stats = {
  dashboard: () => get<DashboardStats>('/stats/dashboard'),
  attendance: (from: string, to: string) => get(`/stats/attendance?from=${from}&to=${to}`),
  revenue: (period?: string) => get(`/stats/revenue${period ? `?period=${period}` : ''}`),
  plans: () => get('/stats/plans'),
  users: (status?: string, limit = 50) => get(`/stats/users?limit=${limit}${status ? `&status=${status}` : ''}`),
  classes: (limit = 20) => get(`/stats/classes?limit=${limit}`),
}

// TV
export const tv = {
  today: () => get<{ date: string; schedules: TVSchedule[] }>('/tv/today'),
}

// Upload
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.url
}

// Dev
export const dev = {
  seedUsers: () => post('/dev/seed-users'),
  seedAll: () => post('/dev/seed-all'),
}
