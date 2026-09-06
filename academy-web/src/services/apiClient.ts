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
      this.academyId = localStorage.getItem('academy_active_id') || 'acad-alianza-01';
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

  public setAcademyId(academyId: string) {
    this.academyId = academyId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('academy_active_id', academyId);
    }
  }

  public getAcademyId(): string {
    return this.academyId || 'acad-alianza-01';
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
      // In development or when API is offline, propagate error with helpful context
      console.warn(`[academy-web] Fallo en petición ${options.method || 'GET'} a ${url}:`, err.message);
      throw err;
    }
  }

  // ==========================================
  // ENDPOINTS DE ACADEMY-API
  // ==========================================

  // 1. Healthcheck & Conexión
  public async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // 2. Autenticación (AuthModule)
  public async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const data = await this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  // 3. Academias (AcademiesModule)
  public async getAcademies(): Promise<any[]> {
    return this.request<any[]>('/academies');
  }

  public async getAcademy(id: string): Promise<any> {
    return this.request<any>(`/academies/${id}`);
  }

  public async updateAcademyProfile(id: string, profile: any): Promise<any> {
    return this.request<any>(`/academies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  // 4. Suscripciones SaaS (SubscriptionsModule)
  public async getSubscriptionStatus(academyId?: string): Promise<any> {
    const targetId = academyId || this.academyId;
    return this.request<any>(`/subscriptions/status/${targetId}`);
  }

  // 5. Facturación SUNAT (SunatModule & InvoicesModule)
  public async getInvoices(params?: { limit?: number; offset?: number }): Promise<any[]> {
    const query = params ? `?limit=${params.limit || 20}&offset=${params.offset || 0}` : '';
    return this.request<any[]>(`/invoices${query}`);
  }

  public async emitInvoice(invoicePayload: any): Promise<any> {
    return this.request<any>('/invoices/emit', {
      method: 'POST',
      body: JSON.stringify(invoicePayload),
    });
  }
}

export const apiClient = new ApiService();
