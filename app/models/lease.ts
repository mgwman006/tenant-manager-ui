import { TenantDetailsDTO, TenantInvitationDetailsDTO } from "./user";

export enum PaymentPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  SIX_MONTHS = "SIX_MONTHS",
  YEARLY = "YEARLY",
}

export enum RentFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum LeaseStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
  TERMINATED = "TERMINATED",
  PENDING = "PENDING",
}

export interface LeaseDetailsDTO {
  referenceNumber: string;
  id: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  rentAmount: number;
  currency: string;
  rentFrequency:RentFrequency;
  fullLeasePaymentRequired:boolean;
  totalAmount:number;
  amountPaid:number;
  balance:number;
  status: LeaseStatus;
  tenant?: TenantDetailsDTO;
  tenantInvitations?: TenantInvitationDetailsDTO[];
}

export interface LeaseCreateDTO {
  rentalProfileId: number;
  unitId: number;
  tenantId?: number;
  landlordFirstName: string;
  landlordLastName: string;
  landlordPhoneNumber: string;
  startDate?: string;
  endDate?: string;
  rentAmount: number;
  currency: string;
  rentFrequency?: RentFrequency;
  fullLeasePaymentRequired?: boolean;
}