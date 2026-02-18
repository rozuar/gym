export interface User {
  id: number
  email: string
  name: string
  phone: string
  role: 'user' | 'admin'
  active: boolean
  avatar_url?: string
  invitation_classes: number
  birth_date?: string
  sex?: string
  weight_kg?: number
  height_cm?: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Plan {
  id: number
  name: string
  description: string
  price: number
  currency: string
  duration: number
  max_classes: number
  active: boolean
}

export interface Subscription {
  id: number
  plan_name: string
  plan_price: number
  start_date: string
  end_date: string
  classes_used: number
  classes_allowed: number
  active: boolean
}

export interface Discipline {
  id: number
  name: string
  description: string
  color: string
  active: boolean
}

export interface ClassItem {
  id: number
  discipline_id: number
  discipline_name: string
  name: string
  description: string
  day_of_week: number
  start_time: string
  end_time: string
  capacity: number
  active: boolean
  instructors: string[]
  instructor_ids: number[]
}

export interface Schedule {
  id: number
  class_id: number
  date: string
  capacity: number
  booked: number
  cancelled: boolean
  class_name: string
  discipline_name: string
  start_time: string
  end_time: string
  available: number
}

export interface Booking {
  id: number
  user_id: number
  class_schedule_id: number
  subscription_id?: number
  status: string
  checked_in_at?: string
  before_photo_url?: string
  created_at: string
  class_name?: string
  discipline_name?: string
  schedule_date?: string
  start_time?: string
}

export interface BookingWithUser extends Booking {
  user_name: string
  user_email: string
}

export interface Instructor {
  id: number
  name: string
  email: string
  phone: string
  specialty: string
  bio: string
  active: boolean
}

export interface Routine {
  id: number
  name: string
  description: string
  type: string
  content: string
  duration: number
  difficulty: string
  instructor_id?: number
  created_by: number
  active: boolean
  billable: boolean
  target_user_id?: number
  is_custom: boolean
  creator_name: string
  instructor_name?: string
  target_user_name?: string
}

export interface UserResult {
  id: number
  user_id: number
  routine_id: number
  class_schedule_id?: number
  score: string
  notes: string
  rx: boolean
  is_pr: boolean
  created_at: string
  routine_name: string
  routine_type: string
  schedule_date?: string
  fistbump_count: number
  user_fistbumped: boolean
}

export interface FeedEvent {
  id: number
  user_id: number
  event_type: string
  ref_id?: number
  data_json: string
  created_at: string
  user_name: string
  avatar_url: string
}

export interface WaitlistEntry {
  id: number
  user_id: number
  class_schedule_id: number
  position: number
  promoted_at?: string
  created_at: string
  user_name?: string
  user_email?: string
}

export interface LeaderboardEntry {
  user_id: number
  user_name: string
  score: string
  rx: boolean
  is_pr: boolean
}

export interface Payment {
  id: number
  user_id: number
  plan_id: number
  amount: number
  currency: string
  status: string
  payment_method: string
  proof_image_url: string
  created_at: string
  user_name?: string
  user_email?: string
  plan_name?: string
}

export interface DashboardStats {
  total_users: number
  active_users: number
  new_users_month: number
  total_revenue: number
  revenue_month: number
  active_subs: number
  classes_today: number
  bookings_today: number
  attendance_today: number
}

export interface TVSchedule extends Schedule {
  routine_name?: string
  routine_type?: string
  routine_content?: string
  leaderboard?: LeaderboardEntry[]
}
