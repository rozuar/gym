const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://gym-api-production-42fa.up.railway.app/api/v1'
    : 'http://localhost:8080/api/v1');

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<any>('/users/me');
  }

  // Stats
  async getDashboard() {
    return this.request<any>('/stats/dashboard');
  }

  async getAttendanceStats(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request<any>(`/stats/attendance?${params}`);
  }

  async getRevenueStats(period?: string) {
    return this.request<any>(`/stats/revenue?period=${period || 'monthly'}`);
  }

  async getPlanStats() {
    return this.request<any>('/stats/plans');
  }

  async getUserStats(status?: string) {
    return this.request<any>(`/stats/users${status ? `?status=${status}` : ''}`);
  }

  async getClassStats() {
    return this.request<any>('/stats/classes');
  }

  // Users
  async getUsers(limit = 50, offset = 0) {
    return this.request<any>(`/users?limit=${limit}&offset=${offset}`);
  }

  async getUser(id: number) {
    return this.request<any>(`/users/${id}`);
  }

  async updateUser(id: number, data: any) {
    return this.request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteUser(id: number) {
    return this.request<any>(`/users/${id}`, { method: 'DELETE' });
  }

  // Plans
  async getPlans() {
    return this.request<any>('/plans');
  }

  async createPlan(data: any) {
    return this.request<any>('/plans', { method: 'POST', body: JSON.stringify(data) });
  }

  async updatePlan(id: number, data: any) {
    return this.request<any>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deletePlan(id: number) {
    return this.request<any>(`/plans/${id}`, { method: 'DELETE' });
  }

  // Disciplines
  async getDisciplines() {
    return this.request<any>('/disciplines');
  }

  async createDiscipline(data: any) {
    return this.request<any>('/disciplines', { method: 'POST', body: JSON.stringify(data) });
  }

  // Classes
  async getClasses() {
    return this.request<any>('/classes');
  }

  async createClass(data: any) {
    return this.request<any>('/classes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateClass(id: number, data: any) {
    return this.request<any>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteClass(id: number) {
    return this.request<any>(`/classes/${id}`, { method: 'DELETE' });
  }

  // Schedules
  async getSchedules(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return this.request<any>(`/schedules?${params}`);
  }

  async generateSchedules(start?: string) {
    return this.request<any>(`/schedules/generate${start ? `?start=${start}` : ''}`, { method: 'POST' });
  }

  async getScheduleAttendance(id: number) {
    return this.request<any>(`/schedules/${id}/attendance`);
  }

  async checkIn(bookingId: number) {
    return this.request<any>(`/bookings/${bookingId}/checkin`, { method: 'POST' });
  }

  // Routines
  async getRoutines() {
    return this.request<any>('/routines');
  }

  async createRoutine(data: any) {
    return this.request<any>('/routines', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateRoutine(id: number, data: any) {
    return this.request<any>(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async assignRoutine(scheduleId: number, routineId: number, notes?: string) {
    return this.request<any>(`/schedules/${scheduleId}/routine`, {
      method: 'POST',
      body: JSON.stringify({ routine_id: routineId, notes }),
    });
  }

  // Payments
  async getPayments(limit = 50, offset = 0) {
    return this.request<any>(`/payments?limit=${limit}&offset=${offset}`);
  }
}

export const api = new ApiClient();
