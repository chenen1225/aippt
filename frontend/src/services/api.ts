const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || '请求失败',
      response.status
    );
  }

  return data.data!;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{
        token: string;
        user: { id: number; username: string; role: string; usageCount: number };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    
    me: () =>
      request<{ id: number; username: string; role: string }>('/auth/me')
  },

  users: {
    list: () =>
      request<any[]>('/users'),
    
    create: (username: string, password: string, usageCount?: number) =>
      request<any>('/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, usageCount })
      }),
    
    update: (id: number, data: { usageCount?: number; password?: string }) =>
      request<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: number) =>
      request<any>(`/users/${id}`, { method: 'DELETE' })
  },

  images: {
    generate: (content: string, config: any) =>
      request<{
        image: { id: number; url: string; prompt: string };
        remainingUsage: number;
      }>('/images/generate', {
        method: 'POST',
        body: JSON.stringify({ content, config })
      }),
    
    list: (page = 1, pageSize = 20) =>
      request<{
        images: any[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(`/images?page=${page}&pageSize=${pageSize}`),
    
    get: (id: number) =>
      request<any>(`/images/${id}`),
    
    delete: (id: number) =>
      request<any>(`/images/${id}`, { method: 'DELETE' }),
    
    downloadUrl: (id: number) => `${API_BASE}/images/${id}/download`
  },

  share: {
    create: (imageId: number) =>
      request<{ id: number; shareCode: string; url: string }>(`/images/${imageId}/share`, {
        method: 'POST'
      }),
    
    get: (code: string) =>
      request<{ url: string; prompt: string; visitCount: number }>(`/share/${code}`),
    
    revoke: (id: number) =>
      request<any>(`/share/${id}/revoke`, { method: 'DELETE' })
  },

  admin: {
    stats: () =>
      request<{
        userCount: number;
        imageCount: number;
        shareCount: number;
        totalUsageRemaining: number;
      }>('/admin/stats')
  }
};

export { ApiError };
