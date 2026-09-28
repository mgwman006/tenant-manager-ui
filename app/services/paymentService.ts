import { NotificationInstance } from "antd/es/notification/interface";
import { paymentApi } from "../api/api";
import { ApiError } from "../models/error";
import { PaymentTransactionCreateDTO } from "../models/payments";


export const recordPayment = async (
    paymentTransaction: PaymentTransactionCreateDTO,
    rentalProfileId: number,
    token: string,
    notificationApi: NotificationInstance,
): Promise<String | null> => {
    
    try {
        return await paymentApi.recordPayment(
          rentalProfileId,
          paymentTransaction,
          token,
        );
    } catch (error: unknown) {
        const apiError = error as ApiError;
        notificationApi.error({
            message: apiError.message ?? "Failed to record payment",
            description: apiError.details
                ? typeof apiError.details === "string"
                    ? apiError.details
                    : JSON.stringify(apiError.details)
                : "Unable to record payment.",
        });
        return null;
    }
}