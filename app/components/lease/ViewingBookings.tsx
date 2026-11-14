import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Empty, List, notification, Spin, Tag, Typography } from "antd";
import { CalendarOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  ViewingBookingDetailsDTO,
  ViewingBookingStatus,
  ViewingPaymentStatus,
} from "../../models/viewing";
import { getViewingBookingsByRequester } from "../../services/viewingService";

const { Text, Title } = Typography;

const statusColor: Record<ViewingBookingStatus, string> = {
  [ViewingBookingStatus.DRAFT]: "default",
  [ViewingBookingStatus.PENDING]: "gold",
  [ViewingBookingStatus.CONFIRMED]: "blue",
  [ViewingBookingStatus.REJECTED]: "red",
  [ViewingBookingStatus.CANCELLED]: "default",
  [ViewingBookingStatus.CLOSED]: "green",
  [ViewingBookingStatus.EXPIRED]: "default",
  [ViewingBookingStatus.RESCHEDULED]: "purple",
};

const paymentColor: Record<ViewingPaymentStatus, string> = {
  [ViewingPaymentStatus.NOT_REQUIRED]: "default",
  [ViewingPaymentStatus.AWAITING_PAYMENT]: "gold",
  [ViewingPaymentStatus.PAID]: "green",
  [ViewingPaymentStatus.FAILED]: "red",
  [ViewingPaymentStatus.REFUNDED]: "purple",
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-TZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const formatFee = (fee: number) =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(fee);

interface ViewingBookingsProps {
  requesterUserId?: number;
  token?: string;
}

export default function ViewingBookings({ requesterUserId, token }: ViewingBookingsProps) {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [bookings, setBookings] = useState<ViewingBookingDetailsDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadBookings = useCallback(async () => {
    if (!requesterUserId || !token) {
      setBookings([]);
      setLoading(false);
      setLoadError(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    const result = await getViewingBookingsByRequester(requesterUserId, token, notificationApi);
    if (result === null) {
      setLoadError(true);
    } else {
      setBookings(result);
    }
    setLoading(false);
  }, [requesterUserId, token, reloadKey]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  if (loading) {
    return (
      <div style={{ minHeight: 180, display: "grid", placeItems: "center" }}>
        {contextHolder}
        <Spin tip="Loading viewing bookings..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        {contextHolder}
        <Alert
          type="error"
          showIcon
          message="Viewing bookings couldn't be loaded"
          description="Try again in a moment."
          action={<Button icon={<ReloadOutlined />} onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div>
      {contextHolder}
      {bookings.length === 0 ? (
        <Card style={{ borderRadius: 16 }}>
          <Empty description="You haven't requested a viewing yet." />
        </Card>
      ) : (
        <List
          dataSource={bookings}
          rowKey="id"
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
          renderItem={(booking) => (
            <List.Item style={{ height: "100%" }}>
              <Card style={{ width: "100%", height: "100%", borderRadius: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <Text type="secondary">Viewing request</Text>
                    <Title level={5} style={{ margin: "4px 0 8px" }}>
                      {booking.reference || `#${booking.id}`}
                    </Title>
                  </div>
                  <Tag color={statusColor[booking.status]}>{booking.status.replaceAll("_", " ")}</Tag>
                </div>

                <div style={{ padding: 14, marginTop: 8, background: "#f7f9fc", borderRadius: 12 }}>
                  <Text type="secondary"><CalendarOutlined /> Requested time</Text>
                  <div style={{ marginTop: 6, fontWeight: 600 }}>
                    {formatDateTime(booking.startTime)}
                  </div>
                  <Text type="secondary">Unit ID: {booking.unitId}</Text>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <Text>
                    Viewing fee: <strong>{formatFee(booking.serviceFee)}</strong>
                  </Text>
                  <Tag color={paymentColor[booking.paymentStatus]}>
                    {booking.paymentStatus.replaceAll("_", " ")}
                  </Tag>
                </div>

                {booking.outcome?.notes && (
                  <Alert
                    type="info"
                    showIcon
                    message={booking.outcome.type.replaceAll("_", " ")}
                    description={booking.outcome.notes}
                    style={{ marginTop: 14, borderRadius: 10 }}
                  />
                )}
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
