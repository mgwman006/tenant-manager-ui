import { NotificationInstance } from "antd/es/notification/interface";
import { leaseApi } from "../api/api";
import { LeaseCreateDTO, LeaseDetailsDTO, RentSummaryDTO } from "../models/lease";
import { ApiError } from "../models/error";
import { LeaseStatus } from "../models/lease";
import { handleApiError } from "../utilities/error-handler";



export const createLease = async (leaseDTO:LeaseCreateDTO, jwtToken:string, notificationApi:NotificationInstance) :Promise<LeaseDetailsDTO | null> => {
    try {
        const data = await leaseApi.createLease(leaseDTO, jwtToken);
        notificationApi.success({
            message: "Lease Created",
            description: "The lease has been successfully created.",
        });
        return data;
    } catch (error: unknown) {
        const apiError = error as ApiError;
        notificationApi.error({
             message: apiError.message ?? "Failed to load leases", 
             description: apiError.details
                 ? typeof apiError.details === "string"
                     ? apiError.details
                     : JSON.stringify(apiError.details)
                 : "can not retrieve errror description 2"
            });
        return null;
    }
}

export const getRentSummary = async (leaseId:number, jwtToken:string, notificationApi:NotificationInstance) :Promise<RentSummaryDTO | null> => {
    try {
        const data = await leaseApi.getRentSummary(leaseId, jwtToken);
        return data;
    } catch (error: unknown) {
        const apiError = error as ApiError;
        notificationApi.error({
             message: apiError.message ?? "Failed to load rent payment", 
             description: apiError.details
                 ? typeof apiError.details === "string"
                     ? apiError.details
                     : JSON.stringify(apiError.details)
                 : "can not retrieve errror description 2"
            });
        return null;
    }
}

export const getLease = async (leaseId: number, jwtToken:string, notificationApi:NotificationInstance) :Promise<LeaseDetailsDTO|null> => {
    try {
        return await leaseApi.getLeaseById(leaseId, jwtToken);
    } catch (error: unknown) {
        const apiError = error as ApiError;
        notificationApi.error({
            message: apiError.message ?? "Unable to load lease details",
            description: apiError.details
                ? typeof apiError.details === "string"
                    ? apiError.details
                    : JSON.stringify(apiError.details)
                : "The lease details could not be loaded.",
        });
        return null;
    }
};

export const getLeasesByTenantAndStatus = async (
    tenantId: number,
    status: LeaseStatus,
    jwtToken: string,
    notificationApi: NotificationInstance,
): Promise<LeaseDetailsDTO[]> => {
    try {
        return await leaseApi.getLeasesByTenantAndStatus(tenantId, status, jwtToken);
    } catch (error: unknown) {
        handleApiError(error, notificationApi);
        return [];
    }
};

