import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, notification, Progress, Spin, Typography } from "antd";
import { leaseApi } from "../../api/api";
import { LeaseDetailsDTO } from "../../models/lease";
import { useAccount } from "../../store/account/AccountContext";

const { Title, Text } = Typography;
const authUrl = import.meta.env.VITE_AUTH_URL?.trim();
const tenantManagerUrl = import.meta.env.VITE_TENANT_MANAGER_URL?.trim();

export default function LeaseDetails() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState<LeaseDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationApi, contextHolder] = notification.useNotification();
  const { accountState } = useAccount();

  const navigateToAuthFromLeaseDeatils = (nextApp: string = "tenant-manager") => {
    if (!authUrl) {
      notificationApi.error({
        message: "Error while reading url",
        description: "VITE_AUTH_URL is not configured.",
      });
      return;
    }

    const outGoingUrlValue = nextApp === "tenant-manager" ? `${tenantManagerUrl}/leases/${leaseId}` : null;
    if (!outGoingUrlValue) {
      console.error("Unable to resolve outgoing URL for auth redirect.");
      return;
    }

    const url = `${authUrl}?outGoingUrl=${encodeURIComponent(outGoingUrlValue)}&phoneNumber=${encodeURIComponent("")}`;
    window.location.href = url;
  };

  useEffect(() => {
    const loadAcceptedLease = async () => {
      const jwtToken = accountState.accountDetails?.token;
      if (!jwtToken) {
        notificationApi.error({
          message: "Jwt token is missing",
          description: "Please Log in first",
        });
        navigateToAuthFromLeaseDeatils();
        setLoading(false);
        return;
      }

      if (!leaseId) {
        notificationApi.error({
          message: "Lease Id Is Invalid",
          description: "Please login again or contact us for support",
        });
        setLoading(false);
        return;
      }

      try {
        const leaseDetails = await leaseApi.getLeaseById(Number(leaseId), jwtToken);
        setLease(leaseDetails);
      } catch (error: any) {
        notificationApi.error({
          message: "Unable to load lease details",
          description: error?.message ?? "The lease details could not be loaded.",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadAcceptedLease();
  }, [leaseId, accountState.accountDetails?.token, notificationApi]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
        {contextHolder}
        <Card style={{ maxWidth: 720, width: "100%" }}>
          <Title level={3}>Lease details unavailable</Title>
          <Text>We could not load the accepted lease information.</Text>
        </Card>
      </div>
    );
  }

  const currency = lease.currency || "TSh";
  const totalObligation = Number(lease.paymentAmount ?? lease.rentAmount ?? 0);
  const amountPaid = Number(lease.amountPaid ?? 0);
  const remaining = Math.max(totalObligation - amountPaid, 0);
  const fullyPaid = remaining <= 0;
  const progressPercent = totalObligation > 0 ? Math.min((amountPaid / totalObligation) * 100, 100) : 0;
  const recommendedMonthly = Math.max(Number(lease.rentAmount ?? lease.paymentAmount ?? 0), 0);
  const rentPerid = lease.rentPeriod ?? "Month";

  const dueDate = lease.endDate ? new Date(lease.endDate) : null;
  const dueLabel = dueDate && !Number.isNaN(dueDate.getTime())
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(dueDate)
    : "—";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      {contextHolder}
      <Card style={{ maxWidth: 760, margin: "0 auto", borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" }}>
        <Title level={2} style={{ marginBottom: 24 }}>Your Rent</Title>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Text type="secondary">Total obligation:</Text>
            <Text strong style={{ fontSize: 18 }}>{currency} {totalObligation.toLocaleString()}</Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Text type="secondary">Due:</Text>
            <Text strong>{dueLabel}</Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Text type="secondary">Paid:</Text>
            <Text strong>{currency} {amountPaid.toLocaleString()}</Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Text type="secondary">Remaining:</Text>
            <Text strong style={{ color: fullyPaid ? "#389e0d" : "#d4380d" }}>
              {currency} {remaining.toLocaleString()}
            </Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Text type="secondary">Recommended:</Text>
            <Text strong>{currency} {recommendedMonthly.toLocaleString()}/{rentPerid}</Text>
          </div>

          <div style={{ marginTop: 8 }}>
            <Progress
              percent={Math.round(progressPercent)}
              showInfo
              strokeColor={fullyPaid ? "#52c41a" : "#1677ff"}
              trailColor="#e6f4ff"
              format={(percent) => `${percent}%`}
            />
          </div>
        </div>

        {!fullyPaid && (
          <Button
            type="primary"
            size="large"
            block
            style={{ marginTop: 24, height: 46, fontWeight: 600 }}
            // onClick={() => navigate(`/lease/${lease.id}`)}
          >
            Pay Rent
          </Button>
        )}
      </Card>
    </div>
  );
}
