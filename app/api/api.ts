import axios from "axios";
import { ApiResponse } from "../models/common";
import { ApiError } from "../models/error";
import { LeaseCreateDTO, LeaseDetailsDTO, RentSummaryDTO } from "../models/lease";
import { TenantDetailsDTO, TenantInvitationCreateDTO, TenantInvitationDetailsDTO } from "../models/user";

const apiUrl = import.meta.env.VITE_RENT_MANAGER_API_URL;

export const apiClient = axios.create({
  baseURL: `${apiUrl}/rent-manager/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { message, data, statusCode } = error.response.data;
      return Promise.reject(
        new ApiError({
          message: message ?? "SERVER_ERROR",
          details: data ?? null,
          statusCode: statusCode ?? error.response.status,
        })
      );
    }

    if (error.request) {
      return Promise.reject(
        new ApiError({
          message: "NETWORK_ERROR",
          details: "No response from server",
          statusCode: 0,
        })
      );
    }

    return Promise.reject(
      new ApiError({
        message: "CLIENT_ERROR",
        details: "Unexpected error occurred",
        statusCode: 0,
      })
    );
  }
);

export const invitationApi = {
    getActiveInvitationsByPhoneNumber: async (phoneNumber :string, jwtToken: string) => {
        const results = await apiClient.get<ApiResponse<TenantInvitationDetailsDTO[]>>(`/lease-invitations/phone/${phoneNumber}`,
            {
                headers: {
                'Authorization': `Bearer ${jwtToken}`
                }
            }
        );
        return handleResponse(results.data);
    },

  getByInvitationToken: async (invitationToken:string,jwtToken: string) => {
    const res = await apiClient.get<ApiResponse<TenantInvitationDetailsDTO>>(`/lease-invitations/${invitationToken}`,
        {
            headers: {
            'Authorization': `Bearer ${jwtToken}`
            }
        }
    );
    return handleResponse(res.data);
  },

  acceptInvitation: async (invitationToken:string, userId:number, jwtToken: string) => {
    const res = await apiClient.post<ApiResponse<TenantInvitationDetailsDTO>>(
      `/tenant-invitations/${invitationToken}/accept?userId=${userId}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    return handleResponse(res.data);
  },

  getLeaseDetailsByInvitationToken: async (invitationToken:string, jwtToken:string) => {
    const res = await apiClient.get<ApiResponse<LeaseDetailsDTO>>(`/lease-invitations/${invitationToken}/lease`,
        {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        }
    );

    return handleResponse(res.data);

  }
};

export const leaseApi = {
    getActiveLeasesByTenantId: async (tenantId : number, token :string) => {
        const result = await apiClient.get<ApiResponse<LeaseDetailsDTO[]>>(`/leases/tenant/${tenantId}`,{
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return handleResponse(result.data);
    },

  getLeaseById: async (id: number, token: string) => {
    const res = await apiClient.get<ApiResponse<LeaseDetailsDTO>>(`/leases/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(res.data);
  },

  createLease: async (requestBody: LeaseCreateDTO, token: string) => {
    const res = await apiClient.post<ApiResponse<LeaseDetailsDTO>>(`/leases/tenant`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(res.data);
  },
  getRentSummary: async (leaseId: number, token: string) => {
    const res = await apiClient.get<ApiResponse<RentSummaryDTO>>(`/leases/rent/summary/${leaseId}`,  {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(res.data);
  },
};

export const tenantApi = {
    getByUserId: async (userId:number, jwtTokwn:string) => {
        const res = await apiClient.get<ApiResponse<TenantDetailsDTO>>(`tenants?userId=${userId}`,{
            headers: {
                Authorization: `Bearer ${jwtTokwn}`,
            }
        });
        return handleResponse(res.data);
    }
};

export function handleResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message ?? "Request failed");
  }

  return response.data;
}
