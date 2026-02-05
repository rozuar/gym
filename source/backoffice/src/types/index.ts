export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  active: boolean;
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  max_classes: number;
  active: boolean;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  classes_used: number;
  classes_allowed: number;
  active: boolean;
  plan_name?: string;
}

export interface Discipline {
  id: number;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
}

export interface Class {
  id: number;
  discipline_id: number;
  name: string;
  description?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  discipline_name?: string;
  instructor_name?: string;
}

export interface Schedule {
  id: number;
  class_id: number;
  date: string;
  capacity: number;
  booked: number;
  available: number;
  cancelled: boolean;
  class_name: string;
  discipline_name: string;
  start_time: string;
  end_time: string;
}

export interface Booking {
  id: number;
  user_id: number;
  class_schedule_id: number;
  status: 'booked' | 'attended' | 'cancelled' | 'no_show';
  checked_in_at?: string;
  class_name: string;
  discipline_name: string;
  schedule_date: string;
  start_time: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
