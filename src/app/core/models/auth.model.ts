export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string;
  membership?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}
