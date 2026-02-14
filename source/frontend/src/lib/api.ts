const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://gym-api-production-42fa.up.railway.app/api/v1'
    : 'http://localhost:8080/api/v1');

class ApiClient {
  private accessToken: string | null = null;
  private refreshing: Promise<boolean> | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.accessToken = data.access_token;
      localStorage.setItem('accessToken', data.access_token);
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && retry && this.accessToken) {
      if (!this.refreshing) {
        this.refreshing = this.tryRefresh().finally(() => { this.refreshing = null; });
      }
      const ok = await this.refreshing;
      if (ok) {
        return this.request<T>(endpoint, options, false);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    return this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refresh(refreshToken: string) {
    return this.request<{ access_token: string; refresh_token: string; user: any }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  /** Dev only: create/reset test users (backend must have API_ENV=development) */
  async seedDevUsers() {
    return this.request<{ message: string; admin: string; user: string }>('/dev/seed-users', {
      method: 'POST',
    });
  }

  /** Dev only: create all test data (users, plans, disciplines, classes, schedules, routines, subscription) */
  async seedDevAll() {
    return this.request<{ message: string; admin: string; user: string }>('/dev/seed-all', {
      method: 'POST',
    });
  }

  // User
  async getMe() {
    return this.request<any>('/users/me');
  }

  async updateMe(data: { name?: string; phone?: string; avatar_url?: string | null }) {
    return this.request<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getConfig() {
    return this.request<{ invitation_class_price: number; before_class_photo_price: number }>('/config');
  }

  async setBookingBeforePhoto(bookingId: number, photoUrl: string) {
    return this.request<any>(`/bookings/${bookingId}/before-photo`, {
      method: 'POST',
      body: JSON.stringify({ photo_url: photoUrl }),
    });
  }

  // Plans
  async getPlans() {
    return this.request<{ plans: any[] }>('/plans');
  }

  // Subscriptions
  async getMySubscription() {
    return this.request<{ subscription: any }>('/subscriptions/me');
  }

  // Payments
  async createPayment(planId: number) {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async getMyPayments() {
    return this.request<{ payments: any[] }>('/payments/me');
  }

  // Disciplines
  async getDisciplines() {
    return this.request<{ disciplines: any[] }>('/disciplines');
  }

  // Classes
  async getClasses() {
    return this.request<{ classes: any[] }>('/classes');
  }

  // Schedules
  async getSchedules(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ schedules: any[]; from: string; to: string }>(`/schedules${query}`);
  }

  // Bookings
  async createBooking(scheduleId: number) {
    return this.request<any>(`/schedules/${scheduleId}/book`, {
      method: 'POST',
    });
  }

  async cancelBooking(bookingId: number) {
    return this.request<any>(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  async getMyBookings(upcoming?: boolean) {
    const query = upcoming ? '?upcoming=true' : '';
    return this.request<{ bookings: any[] }>(`/bookings/me${query}`);
  }

  // Routines
  async getRoutines(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request<{ routines: any[] }>(`/routines${query}`);
  }

  async getScheduleRoutine(scheduleId: number) {
    return this.request<{ routine: any }>(`/schedules/${scheduleId}/routine`);
  }

  async getMyResults() {
    return this.request<{ results: any[] }>('/results/me');
  }

  async logResult(data: { routine_id: number; score: string; notes?: string; rx?: boolean; class_schedule_id?: number }) {
    return this.request<any>('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResult(resultId: number, data: { score?: string; notes?: string; rx?: boolean }) {
    return this.request<any>(`/results/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResult(resultId: number) {
    return this.request<any>(`/results/${resultId}`, {
      method: 'DELETE',
    });
  }

  async getRoutineHistory(routineId: number) {
    return this.request<{ history: any[] }>(`/routines/${routineId}/history`);
  }
}

export const api = new ApiClient();
