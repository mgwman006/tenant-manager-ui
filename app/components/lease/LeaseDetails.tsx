import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Descriptions, notification, Spin, Typography } from "antd";
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
  const { accountState, dispatchAccountState } = useAccount();
  

  const navigateToAuthFromLeaseDeatils = (nextApp: string = "tenant-manager", phone?: string) => {
        if (!authUrl) {
            notificationApi.error({
            message: "Error while reading url",
            description: "VITE_AUTH_URL is not configured.",
            });
            return;
        }

        const outGoingUrlValue = nextApp === "tenant-manager" ? `${tenantManagerUrl}/leases/${leaseId}`: null;
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

    loadAcceptedLease();
  }, [leaseId]);

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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      {contextHolder}
      <Card style={{ maxWidth: 860, margin: "0 auto" }}>
        <Title level={2}>Lease overview</Title>
        <Alert
          type="success"
          showIcon
          message="Invitation accepted successfully"
          description="Your lease has been activated and detailed records are shown below."
          style={{ marginBottom: 20 }}
        />

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Reference">{lease.referenceNumber}</Descriptions.Item>
          <Descriptions.Item label="Status">{lease.status}</Descriptions.Item>
          <Descriptions.Item label="Start date">{new Date(lease.startDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="End date">{new Date(lease.endDate).toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Rent amount">{lease.currency} {lease.rentAmount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Amount paid">{lease.currency} {Number(lease.amountPaid ?? 0).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Outstanding balance">{lease.currency} {Number(lease.balance ?? 0).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Tenant">{lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : "N/A"}</Descriptions.Item>
        </Descriptions>

        {/* <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={() => navigate("/invitation" + (invitationToken ? `/${invitationToken}` : ""))}>Back to summary</Button>
        </div> */}
      </Card>
    </div>
  );
}
