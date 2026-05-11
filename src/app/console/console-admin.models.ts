export interface ConsoleState {
  id: number;
  state_name: string;
  state_shortname: string;
}

export interface ConsoleCity {
  id: number;
  city_name: string;
  city_shortnames?: string;
  city_shortname?: string;
  state_id: number;
  state_name?: string;
}

export interface ConsoleLocation {
  id: number;
  location?: string | null;
  location_name?: string | null;
  city_id: number;
  city_name?: string | null;
  state_id: number;
  state_name?: string | null;
}

export interface ConsoleModuleUser {
  user_id: number;
  name: string;
  email?: string | null;
  mobile_num?: string | null;
  base_role_id: number;
  base_role_code: string;
  active_modules: string[];
}

export interface ConsoleModuleAccessItem {
  access_id: number;
  user_id: number;
  name: string;
  email?: string | null;
  mobile_num?: string | null;
  base_role_id: number;
  base_role_code: string;
  module_code: string;
  is_active: boolean;
  granted_by_user_id?: number | null;
  granted_by_role?: string | null;
  granted_at: string;
  revoked_by_user_id?: number | null;
  revoked_by_role?: string | null;
  revoked_at?: string | null;
  reason?: string | null;
}

export interface ConsoleModuleUsersResponse {
  items: ConsoleModuleUser[];
}

export interface ConsoleModuleAccessResponse {
  items: ConsoleModuleAccessItem[];
}
