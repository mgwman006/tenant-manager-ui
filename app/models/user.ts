export interface User {
  firstName: string;
  lastName: string;
  email: string;
  passWord: string;
}

export interface LogInDetails {
  email: string;
  passWord: string;
}

export interface MembershipDetailsDTO {
  id: number;
  userId: number;
  organizationId: number;
  organizationName: string;
  membershipRole?: string;
}

export interface UserDetailsDTO {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  tenantId?: number;
  memberships: MembershipDetailsDTO[];
}

export interface TenantDetailsDTO {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}



export interface AccountDetailsDto {
  id: number;
  phoneNumber: string;
  email: string;
  enabled: boolean;
  userDetails: UserDetailsDTO;
  token: string;
}

export type AccountState = {
  accountDetails: AccountDetailsDto | null;
  loading: boolean;
  error: string | null;
  outGoingUrl: string | null;
};

export type TenantState = {
  tenantDetails: TenantDetailsDTO | null;
  loading: boolean;
  error: string | null;
};

export type AccountAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: AccountDetailsDto }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "APPEND_USER"; payload: string }
  | { type: "APPEND_JWT"; payload: string }
  | { type: "ADD_OUTGOING_URL"; outGoingUrl: string | null };


  export type TenantAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: TenantDetailsDTO }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "LOGOUT" };
