import { NotificationInstance } from "antd/es/notification/interface";
import { tenantApi } from "../api/api";
import { TenantDetailsDTO } from "../models/user";
import { handleApiError } from "../utilities/error-handler";

export async function getTenantByUserId(
  userId: number,
  jwtToken: string,
  notificationApi: NotificationInstance,
): Promise<TenantDetailsDTO | null> {
  try {
    return await tenantApi.getByUserId(userId, jwtToken);
  } catch (error: unknown) {
    handleApiError(error, notificationApi);
    return null;
  }
}