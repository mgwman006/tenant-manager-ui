import { TenantDetailsDTO, TenantInvitationDetailsDTO } from "./user";

export enum PaymentPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  SIX_MONTHS = "SIX_MONTHS",
  YEARLY = "YEARLY",
}

export enum RentFrequency {
  DAILY = "Per Day",
  WEEKLY = "Per Week",
  MONTHLY = "Per Month",
  YEARLY = "Per Year",
}

export enum LeaseStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
  TERMINATED = "TERMINATED",
  PENDING = "PENDING",
}

export enum RentPaymentStatus
{
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  UNPAID = "UNPAID",
  OVER_PAID = "OVER_PAID"
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

export interface RentPaymentOutstanding{
  leaseReferenceNumber:string;
  rentAmount: number;
  rentFrequency: string;
  fullLeasePaymentRequired: boolean;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  status: RentPaymentStatus,
  dueDate: string,
  period: string
}