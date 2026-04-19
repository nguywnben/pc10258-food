export interface MembershipPlanInfo {
  id: number;
  name: string;
  price: number;
}

export interface AccountProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  role?: string;
  membership?: string;
  membership_plan?: MembershipPlanInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileResponse {
  data: AccountProfile;
}

export interface UpdateProfileRequest {
  full_name: string;
  email: string;
  phone: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: AccountProfile;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface AddressRecord {
  id: number;
  user_id: number;
  label: string;
  full_address: string;
  is_default: number;
  created_at?: string;
  updated_at?: string;
}

export interface AddressListResponse {
  status: number;
  data: AddressRecord[];
}

export interface AddressPayload {
  label: string;
  full_address: string;
  is_default: boolean;
}

export interface AddressMutationResponse {
  message: string;
  data: AddressRecord;
}