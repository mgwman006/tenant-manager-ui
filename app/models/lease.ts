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
}

export enum PaymentBlockStatus
{
  PAID = "PAID",
  UNPAID = "UNPAID",
}

PaymentBlockStatus

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

export interface RentSummaryDTO{
  totalExpectedAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  status: RentPaymentStatus,
  paymentBlocks: PaymentBlockSummaryDTO[],
}

export interface PaymentBlockSummaryDTO{
  id:number;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  startDate:string;
  endDate:string;
  dueDate: string;
  status: PaymentBlockStatus
}