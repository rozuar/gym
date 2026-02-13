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

  async updateMe(data: { name?: string; phone?: string; avatar_url?: string }) {
    return this.request<any>('/users/me', { method: 'PUT', body: JSON.stringify(data) });
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

  async addInvitation(userId: number, count: number) {
    return this.request<any>(`/users/${userId}/invitation`, { method: 'POST', body: JSON.stringify({ count }) });
  }

  // Plans
  async getPlans() {
    return this.request<any>('/plans');
  }

  async getPlan(id: number) {
    return this.request<any>(`/plans/${id}`);
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

  async getClass(id: number) {
    return this.request<any>(`/classes/${id}`);
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
  async getRoutines(params?: { type?: string; custom?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.type) qs.append('type', params.type);
    if (params?.custom !== undefined) qs.append('custom', String(params.custom));
    const query = qs.toString();
    return this.request<any>(`/routines${query ? `?${query}` : ''}`);
  }

  async getCustomRoutines(userId?: number) {
    const qs = userId ? `?user_id=${userId}` : '';
    return this.request<any>(`/routines/custom${qs}`);
  }

  async createRoutine(data: any) {
    return this.request<any>('/routines', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateRoutine(id: number, data: any) {
    return this.request<any>(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteRoutine(id: number) {
    return this.request<any>(`/routines/${id}`, { method: 'DELETE' });
  }

  async assignRoutine(scheduleId: number, routineId: number, notes?: string) {
    return this.request<any>(`/schedules/${scheduleId}/routine`, {
      method: 'POST',
      body: JSON.stringify({ routine_id: routineId, notes }),
    });
  }

  async removeScheduleRoutine(scheduleId: number) {
    return this.request<any>(`/schedules/${scheduleId}/routine`, { method: 'DELETE' });
  }

  async getScheduleRoutine(scheduleId: number) {
    return this.request<any>(`/schedules/${scheduleId}/routine`);
  }

  // Instructors
  async getInstructors(activeOnly = false) {
    return this.request<any>(`/instructors${activeOnly ? '' : '?active=false'}`);
  }

  async getInstructor(id: number) {
    return this.request<any>(`/instructors/${id}`);
  }

  async createInstructor(data: any) {
    return this.request<any>('/instructors', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateInstructor(id: number, data: any) {
    return this.request<any>(`/instructors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteInstructor(id: number) {
    return this.request<any>(`/instructors/${id}`, { method: 'DELETE' });
  }

  // Payments
  async getPayments(limit = 50, offset = 0) {
    return this.request<any>(`/payments?limit=${limit}&offset=${offset}`);
  }

  async createPayment(data: { user_id: number; plan_id: number; payment_method: string; proof_image_url?: string }) {
    return this.request<any>('/payments', { method: 'POST', body: JSON.stringify(data) });
  }

  // Export (returns blob, triggers download)
  private async downloadExport(endpoint: string, filename: string) {
    const url = `${API_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const res = await fetch(url, {
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
    });
    if (!res.ok) throw new Error('Error al exportar');
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition');
    const match = disposition?.match(/filename=([^;]+)/);
    const name = match ? match[1].replace(/"/g, '') : filename;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async exportUsers(status?: string) {
    await this.downloadExport(`/export/users${status ? `?status=${status}` : ''}`, 'users.csv');
  }

  async exportRevenue(period?: string) {
    await this.downloadExport(`/export/revenue${period ? `?period=${period}` : ''}`, 'revenue.csv');
  }

  async getMonthlyReport(month?: string) {
    const query = month ? `?month=${month}` : '';
    return this.request<any>(`/stats/report${query}`);
  }
}

export const api = new ApiClient();
