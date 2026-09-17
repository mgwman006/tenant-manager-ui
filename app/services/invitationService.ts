import { NotificationInstance } from "antd/es/notification/interface";
import { leaseApi, invitationApi } from "../api/api";
import { LeaseCreateDTO, LeaseDetailsDTO } from "../models/lease";
import { ApiError } from "../models/error";
import { TenantInvitationDetailsDTO } from "../models/user";



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

 export const getActiveInvitations = async (phoneNumber:string, jwtToken:string,notificationApi:NotificationInstance): Promise<TenantInvitationDetailsDTO[]> => {
    if (!phoneNumber || !jwtToken) {
      return [];
    }

    try {
      return invitationApi.getActiveInvitationsByPhoneNumber(phoneNumber, jwtToken);

    } catch (error) {
      const apiError = error as ApiError;
        notificationApi.error({
             message: apiError.message ?? "Failed to load leases", 
             description: apiError.details
                 ? typeof apiError.details === "string"
                     ? apiError.details
                     : JSON.stringify(apiError.details)
                 : "can not retrieve errror description 2"
            });
        return [];
    }
  };

