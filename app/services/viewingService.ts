import { NotificationInstance } from "antd/es/notification/interface";
import { viewingApi } from "../api/api";
import { ApiError } from "../models/error";
import { ViewingBookingDetailsDTO } from "../models/viewing";

export const getViewingBookingsByRequester = async (
  requesterUserId: number,
  token: string,
  notificationApi: NotificationInstance,
): Promise<ViewingBookingDetailsDTO[] | null> => {
  try {
    return await viewingApi.getBookingsByRequester(requesterUserId, token);
  } catch (error: unknown) {
    const apiError = error instanceof ApiError ? error : null;
    notificationApi.error({
      message: apiError?.message ?? "Unable to load viewing bookings",
      description: apiError?.details
        ? typeof apiError.details === "string"
          ? apiError.details
          : JSON.stringify(apiError.details)
        : "Your viewing bookings could not be loaded. Please try again.",
    });
    return null;
  }
};
