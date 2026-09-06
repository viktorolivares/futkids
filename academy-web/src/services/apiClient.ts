/**
 * Cliente HTTP desacoplado para academy-web
 * Conecta directamente con los endpoints REST de academy-api (NestJS)
 * Soporta headers automáticos: Authorization (JWT) y x-academy-id (Multi-Tenancy)
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3001/api/v1');

export interface ApiClientConfig {
  baseUrl: string;
  token?: string | null;
  academyId?: string | null;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private academyId: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('academy_jwt_token');
      this.academyId = localStorage.getItem('academy_active_id') || 'acad-demo-01';
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('academy_jwt_token', token);
      } else {
        localStorage.removeItem('academy_jwt_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('academy_jwt_token');
    }
    return this.token;
  }

  public setAcademyId(academyId: string) {
    this.academyId = academyId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('academy_active_id', academyId);
    }
  }

  public getAcademyId(): string {
    return this.academyId || 'acad-demo-01';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.academyId) {
      headers['x-academy-id'] = this.academyId;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorBody.message || `API Error ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.warn(`[academy-web] Fallo en petición ${options.method || 'GET'} a ${url}:`, err.message);
      throw err;
    }
  }

  // ==========================================
  // 1. HEALTHCHECK & CONEXIÓN
  // ==========================================
  public async checkHealth(): Promise<{ status: string; timestamp: string; services?: any }> {
    return this.request<{ status: string; timestamp: string; services?: any }>('/health');
  }

  // ==========================================
  // 2. AUTENTICACIÓN (AuthModule)
  // ==========================================
  public async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; user: any; refreshToken?: string }> {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const token = data?.accessToken || data?.access_token;
    if (token) {
      this.setToken(token);
    }
    if (data?.user?.memberships?.[0]?.academyId) {
      this.setAcademyId(data.user.memberships[0].academyId);
    }
    return {
      accessToken: token,
      user: data.user,
      refreshToken: data.refreshToken,
    };
  }

  public async getMe(): Promise<any> {
    return this.request<any>('/auth/me');
  }

  // ==========================================
  // 3. ACADEMIAS (AcademiesModule)
  // ==========================================
  public async getMyAcademies(): Promise<any[]> {
    return this.request<any[]>('/academies/my');
  }

  public async getAllAcademies(): Promise<any[]> {
    return this.request<any[]>('/academies');
  }

  public async getAcademies(): Promise<any[]> {
    return this.request<any[]>('/academies').catch(() => this.request<any[]>('/academies/my'));
  }

  public async getAcademy(id: string): Promise<any> {
    return this.request<any>(`/academies/${id}`);
  }

  public async createAcademy(academyDto: any): Promise<any> {
    return this.request<any>('/academies', {
      method: 'POST',
      body: JSON.stringify(academyDto),
    });
  }

  public async getStaff(academyId?: string): Promise<any[]> {
    const id = academyId || this.getAcademyId();
    return this.request<any[]>(`/academies/${id}/staff`);
  }

  public async addStaff(academyId: string, data: any): Promise<any> {
    return this.request<any>(`/academies/${academyId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async removeStaff(academyId: string, membershipId: string): Promise<any> {
    return this.request<any>(`/academies/${academyId}/staff/${membershipId}`, {
      method: 'DELETE',
    });
  }

  public async getBillingConfig(academyId?: string): Promise<any> {
    const id = academyId || this.getAcademyId();
    return this.request<any>(`/academies/${id}/billing-config`);
  }

  public async updateBillingConfig(academyId: string, data: any): Promise<any> {
    return this.request<any>(`/academies/${academyId}/billing-config`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // 4. SUSCRIPCIONES SAAS (SubscriptionsModule)
  // ==========================================
  public async getSubscription(): Promise<any> {
    return this.request<any>('/subscription');
  }

  public async getSubscriptionStatus(academyId?: string): Promise<any> {
    if (academyId && academyId !== this.academyId) {
      this.setAcademyId(academyId);
    }
    return this.request<any>('/subscription');
  }

  public async upgradeSubscription(planCode: string = 'PRO'): Promise<any> {
    return this.request<any>('/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planCode }),
    });
  }

  public async downgradeSubscription(reason?: string): Promise<any> {
    return this.request<any>('/subscription/downgrade', {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Solicitud de downgrade manual' }),
    });
  }

  // ==========================================
  // 5. ESTUDIANTES (StudentsModule)
  // ==========================================
  public async getStudents(search?: string): Promise<any[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/students${query}`);
  }

  public async getStudent(id: string): Promise<any> {
    return this.request<any>(`/students/${id}`);
  }

  public async createStudent(payload: any): Promise<any> {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateStudent(id: string, payload: any): Promise<any> {
    return this.request<any>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteStudent(id: string): Promise<any> {
    return this.request<any>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // 6. FAMILIAS & APODERADOS (FamiliesModule)
  // ==========================================
  public async getFamilies(search?: string): Promise<any[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<any[]>(`/families${query}`);
  }

  public async getFamily(id: string): Promise<any> {
    return this.request<any>(`/families/${id}`);
  }

  public async createFamily(payload: any): Promise<any> {
    return this.request<any>('/families', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateFamily(id: string, payload: any): Promise<any> {
    return this.request<any>(`/families/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async deleteFamily(id: string): Promise<any> {
    return this.request<any>(`/families/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // 7. ACADÉMICO / DEPORTES / GRUPOS / ASISTENCIA (AcademicModule)
  // ==========================================
  public async getSports(): Promise<any[]> {
    return this.request<any[]>('/academic/sports');
  }

  public async createSport(payload: any): Promise<any> {
    return this.request<any>('/academic/sports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getGroups(): Promise<any[]> {
    return this.request<any[]>('/academic/groups');
  }

  public async createGroup(payload: any): Promise<any> {
    return this.request<any>('/academic/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getSessions(): Promise<any[]> {
    return this.request<any[]>('/academic/sessions');
  }

  public async createSession(payload: any): Promise<any> {
    return this.request<any>('/academic/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async saveAttendance(sessionId: string, records: any[]): Promise<any> {
    return this.request<any>(`/academic/sessions/${sessionId}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ records }),
    });
  }

  // ==========================================
  // 8. FINANZAS / CARGOS / PAGOS / CRÉDITOS (FinanceModule)
  // ==========================================
  public async getCharges(): Promise<any[]> {
    return this.request<any[]>('/finance/charges');
  }

  public async createCharge(payload: any): Promise<any> {
    return this.request<any>('/finance/charges', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getPayments(): Promise<any[]> {
    return this.request<any[]>('/finance/payments');
  }

  public async createPayment(payload: any): Promise<any> {
    return this.request<any>('/finance/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getCustomerCredits(): Promise<any[]> {
    return this.request<any[]>('/finance/customer-credits');
  }

  public async createRefund(payload: any): Promise<any> {
    return this.request<any>('/finance/refunds', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // 9. COMERCIAL / PAQUETES / PROMOS / TRIALS (CommercialModule)
  // ==========================================
  public async getPackages(): Promise<any[]> {
    return this.request<any[]>('/commercial/packages');
  }

  public async createPackage(payload: any): Promise<any> {
    return this.request<any>('/commercial/packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getPromotions(): Promise<any[]> {
    return this.request<any[]>('/commercial/promotions');
  }

  public async createPromotion(payload: any): Promise<any> {
    return this.request<any>('/commercial/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getTrials(): Promise<any[]> {
    return this.request<any[]>('/commercial/trials');
  }

  public async convertTrial(trialId: string): Promise<any> {
    return this.request<any>(`/commercial/trials/${trialId}/convert`, {
      method: 'POST',
    });
  }

  // ==========================================
  // 10. POLÍTICAS DE ACADEMIA (PoliciesModule)
  // ==========================================
  public async getPolicy(): Promise<any> {
    return this.request<any>('/policies');
  }

  public async updatePolicy(payload: any): Promise<any> {
    return this.request<any>('/policies', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // 11. FACTURACIÓN SUNAT (InvoicesModule)
  // ==========================================
  public async getInvoices(params?: { limit?: number; offset?: number; status?: string }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<any[]>(`/invoices${query}`);
  }

  public async emitInvoice(invoicePayload: any): Promise<any> {
    return this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoicePayload),
    });
  }

  public async testSunatBeta(payload: any): Promise<any> {
    return this.request<any>('/invoices/test-sunat-beta', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiService();
