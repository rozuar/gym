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
  trial_price?: number
  trial_days?: number
}

export interface DiscountCode {
  id: number
  code: string
  description: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  max_uses: number
  uses_count: number
  valid_until?: string
  active: boolean
  created_at: string
}

export interface Badge {
  id: number
  user_id: number
  badge_type: string
  awarded_at: string
  name: string
  description: string
  icon: string
}

export interface RetentionAlert {
  user_id: number
  user_name: string
  user_email: string
  last_booking?: string
  days_inactive: number
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
  frozen: boolean
  frozen_until?: string
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
  content_scaled?: string
  content_beginner?: string
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

export interface Challenge {
  id: number
  name: string
  description?: string
  goal?: string
  type: string
  start_date?: string
  end_date?: string
  active: boolean
  created_by: number
  created_at: string
  participant_count?: number
}

export interface ChallengeParticipant {
  id: number
  challenge_id: number
  user_id: number
  score?: string
  notes?: string
  completed_at?: string
  created_at: string
  user_name: string
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
  mrr: number
  churn_rate: number
  new_leads: number
}

export interface Lead {
  id: number
  name: string
  email?: string
  phone?: string
  source: string
  status: string
  notes?: string
  assigned_to?: number
  assignee_name?: string
  created_at: string
  updated_at: string
}

export interface BodyMeasurement {
  id: number
  user_id: number
  weight_kg?: number
  body_fat_pct?: number
  chest_cm?: number
  waist_cm?: number
  hip_cm?: number
  arm_cm?: number
  thigh_cm?: number
  notes?: string
  photo_url?: string
  measured_at: string
  created_at: string
}

export interface ResultComment {
  id: number
  result_id: number
  user_id: number
  user_name: string
  avatar_url?: string
  content: string
  created_at: string
}

export interface OnrampProgram {
  id: number
  name: string
  description?: string
  required_sessions: number
  active: boolean
  created_at: string
  enrolled_count?: number
}

export interface OnrampEnrollment {
  id: number
  user_id: number
  program_id: number
  sessions_completed: number
  completed_at?: string
  created_at: string
  user_name?: string
  user_email?: string
  program_name?: string
}

export interface Movement {
  id: number
  name: string
  description: string
  category: string
  video_url: string
  muscles_primary: string
  muscles_secondary: string
  active: boolean
  created_at: string
}

export interface GymEvent {
  id: number
  title: string
  description: string
  event_type: string
  date: string
  capacity: number
  price: number
  currency: string
  image_url: string
  active: boolean
  created_by: number
  created_at: string
  registered_count: number
  is_registered: boolean
}

export interface EventRegistration {
  id: number
  event_id: number
  user_id: number
  status: string
  paid: boolean
  created_at: string
  user_name: string
  user_email: string
}

export interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  image_url: string
  active: boolean
  created_at: string
}

export interface SaleItem {
  id?: number
  sale_id?: number
  product_id?: number | null
  product_name: string
  quantity: number
  unit_price: number
}

export interface Sale {
  id: number
  user_id?: number
  total: number
  payment_method: string
  notes: string
  created_by: number
  created_at: string
  items: SaleItem[]
  user_name: string
}

export interface Tag {
  id: number
  name: string
  color: string
}

export interface NutritionLog {
  id: number
  user_id: number
  food_name: string
  grams?: number
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  meal_type: string
  logged_at: string
  created_at: string
}

export interface WaterLog {
  id: number
  user_id: number
  ml: number
  logged_at: string
  created_at: string
}

export interface NutritionSummary {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  water_ml: number
}

export interface TVSchedule extends Schedule {
  routine_name?: string
  routine_type?: string
  routine_content?: string
  routine_content_scaled?: string
  routine_content_beginner?: string
  leaderboard?: LeaderboardEntry[]
}
