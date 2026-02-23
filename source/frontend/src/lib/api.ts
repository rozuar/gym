import type { AuthResponse, User, Plan, Subscription, Discipline, ClassItem, Schedule, Booking, BookingWithUser, Instructor, Routine, UserResult, FeedEvent, WaitlistEntry, LeaderboardEntry, Payment, DashboardStats, TVSchedule, DiscountCode, Badge, RetentionAlert, Challenge, ChallengeParticipant, Lead, BodyMeasurement, ResultComment, OnrampProgram, OnrampEnrollment, Movement, GymEvent, EventRegistration, Product, Sale, SaleItem, Tag, NutritionLog, WaterLog, NutritionSummary } from '../types'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1'

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
  mySubscription: () => get<{ subscription: Subscription | null }>('/subscriptions/me'),
  freeze: (freezeUntil: string) => post('/subscriptions/me/freeze', { freeze_until: freezeUntil }),
  unfreeze: () => post('/subscriptions/me/unfreeze'),
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

// Discount codes
export const discountCodes = {
  list: () => get<{ codes: DiscountCode[] }>('/discount-codes'),
  create: (data: Partial<DiscountCode> & { valid_until?: string }) => post<DiscountCode>('/discount-codes', data),
  remove: (id: number) => del(`/discount-codes/${id}`),
  validate: (code: string) => get<{ code: string; discount_type: string; discount_value: number; description: string }>(`/discount-codes/validate?code=${encodeURIComponent(code)}`),
}

// Badges
export const badges = {
  mine: () => get<{ badges: Badge[] }>('/badges/me'),
}

// Stats
export const stats = {
  dashboard: () => get<DashboardStats>('/stats/dashboard'),
  attendance: (from: string, to: string) => get(`/stats/attendance?from=${from}&to=${to}`),
  revenue: (period?: string) => get(`/stats/revenue${period ? `?period=${period}` : ''}`),
  plans: () => get('/stats/plans'),
  users: (status?: string, limit = 50) => get(`/stats/users?limit=${limit}${status ? `&status=${status}` : ''}`),
  classes: (limit = 20) => get(`/stats/classes?limit=${limit}`),
  retention: (days = 30) => get<{ alerts: RetentionAlert[]; days: number }>(`/stats/retention?days=${days}`),
}

// Challenges
export const challenges = {
  list: (activeOnly = true) => get<{ challenges: Challenge[] }>(`/challenges?active=${activeOnly}`),
  mine: () => get<{ challenges: Challenge[] }>('/challenges/mine'),
  getById: (id: number) => get<{ challenge: Challenge; participants: ChallengeParticipant[]; is_participant: boolean }>(`/challenges/${id}`),
  create: (data: Partial<Challenge> & { start_date?: string; end_date?: string }) => post<Challenge>('/challenges', data),
  update: (id: number, data: Partial<Challenge> & { start_date?: string; end_date?: string }) => put<Challenge>(`/challenges/${id}`, data),
  remove: (id: number) => del(`/challenges/${id}`),
  join: (id: number) => post(`/challenges/${id}/join`),
  leave: (id: number) => del(`/challenges/${id}/join`),
  submitProgress: (id: number, score: string, notes?: string) => post(`/challenges/${id}/progress`, { score, notes }),
}

// Leads
export const leads = {
  list: (status?: string) => get<{ leads: Lead[]; counts: Record<string, number> }>(`/leads${status ? `?status=${status}` : ''}`),
  create: (data: Partial<Lead>) => post<Lead>('/leads', data),
  update: (id: number, data: Partial<Lead>) => put<Lead>(`/leads/${id}`, data),
  remove: (id: number) => del(`/leads/${id}`),
}

// Body tracking
export const bodyTracking = {
  list: (limit?: number) => get<{ measurements: BodyMeasurement[] }>(`/body-tracking${limit ? `?limit=${limit}` : ''}`),
  create: (data: Partial<BodyMeasurement> & { measured_at?: string }) => post<BodyMeasurement>('/body-tracking', data),
  remove: (id: number) => del(`/body-tracking/${id}`),
}

// Comments
export const comments = {
  list: (resultId: number) => get<{ comments: ResultComment[] }>(`/results/${resultId}/comments`),
  create: (resultId: number, content: string) => post<ResultComment>(`/results/${resultId}/comments`, { content }),
  remove: (resultId: number, commentId: number) => del(`/results/${resultId}/comments/${commentId}`),
}

// On-ramp
export const onramp = {
  listPrograms: (activeOnly = true) => get<{ programs: OnrampProgram[] }>(`/onramp/programs?active=${activeOnly}`),
  createProgram: (data: Partial<OnrampProgram>) => post<OnrampProgram>('/onramp/programs', data),
  updateProgram: (id: number, data: Partial<OnrampProgram>) => put<OnrampProgram>(`/onramp/programs/${id}`, data),
  deleteProgram: (id: number) => del(`/onramp/programs/${id}`),
  enroll: (userId: number, programId: number) => post('/onramp/enroll', { user_id: userId, program_id: programId }),
  updateSessions: (userId: number, programId: number, sessions: number) => put(`/onramp/users/${userId}/programs/${programId}/sessions`, { sessions }),
  listEnrollments: (programId: number) => get<{ enrollments: OnrampEnrollment[] }>(`/onramp/programs/${programId}/enrollments`),
  myEnrollments: () => get<{ enrollments: OnrampEnrollment[] }>('/onramp/me'),
}

// Movements (2.4)
export const movements = {
  list: (category?: string, search?: string, activeOnly = true) => {
    const p = new URLSearchParams()
    if (category) p.set('category', category)
    if (search) p.set('search', search)
    if (!activeOnly) p.set('active', 'false')
    return get<{ movements: Movement[] }>(`/movements?${p}`)
  },
  getById: (id: number) => get<Movement>(`/movements/${id}`),
  create: (data: Partial<Movement>) => post<Movement>('/movements', data),
  update: (id: number, data: Partial<Movement>) => put<Movement>(`/movements/${id}`, data),
  remove: (id: number) => del(`/movements/${id}`),
}

// Events (16.1-16.4)
export const events = {
  list: (activeOnly = true) => get<{ events: GymEvent[] }>(`/events?active=${activeOnly}`),
  mine: () => get<{ events: GymEvent[] }>('/events/me'),
  getById: (id: number) => get<{ event: GymEvent; registrations: EventRegistration[] }>(`/events/${id}`),
  create: (data: Partial<GymEvent> & { date: string }) => post<GymEvent>('/events', data),
  update: (id: number, data: Partial<GymEvent> & { date?: string }) => put<GymEvent>(`/events/${id}`, data),
  remove: (id: number) => del(`/events/${id}`),
  register: (id: number) => post(`/events/${id}/register`),
  unregister: (id: number) => del(`/events/${id}/register`),
  listRegistrations: (id: number) => get<{ registrations: EventRegistration[] }>(`/events/${id}/registrations`),
  updateRegistration: (id: number, userId: number, paid: boolean) => put(`/events/${id}/registrations`, { user_id: userId, paid }),
}

// Products / POS (5.6)
export const products = {
  list: (activeOnly = true) => get<{ products: Product[] }>(`/products?active=${activeOnly}`),
  create: (data: Partial<Product>) => post<Product>('/products', data),
  update: (id: number, data: Partial<Product>) => put<Product>(`/products/${id}`, data),
  remove: (id: number) => del(`/products/${id}`),
}
export const sales = {
  list: (limit = 50, offset = 0) => get<{ sales: Sale[] }>(`/sales?limit=${limit}&offset=${offset}`),
  create: (data: { user_id?: number; payment_method: string; notes?: string; items: SaleItem[] }) => post<Sale>('/sales', data),
}

// Tags (6.8)
export const tags = {
  list: () => get<{ tags: Tag[] }>('/tags'),
  create: (name: string, color: string) => post<Tag>('/tags', { name, color }),
  update: (id: number, data: Partial<Tag>) => put<Tag>(`/tags/${id}`, data),
  remove: (id: number) => del(`/tags/${id}`),
  getUserTags: (userId: number) => get<{ tags: Tag[] }>(`/users/${userId}/tags`),
  addUserTag: (userId: number, tagId: number) => post(`/users/${userId}/tags`, { tag_id: tagId }),
  removeUserTag: (userId: number, tagId: number) => del(`/users/${userId}/tags/${tagId}`),
}

// Nutrition (9.4-9.7)
export const nutrition = {
  getDay: (date?: string) => get<{ logs: NutritionLog[]; summary: NutritionSummary; water: WaterLog[] }>(`/nutrition${date ? `?date=${date}` : ''}`),
  logFood: (data: Partial<NutritionLog> & { food_name: string }) => post<NutritionLog>('/nutrition', data),
  deleteLog: (id: number) => del(`/nutrition/${id}`),
  logWater: (ml: number, date?: string) => post('/nutrition/water', { ml, logged_at: date }),
  deleteWater: (id: number) => del(`/nutrition/water/${id}`),
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
