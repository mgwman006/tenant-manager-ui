import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Descriptions, notification, Result, Spin, Tag } from "antd";
import { leaseApi, invitationApi } from "../../api/api";
import { useAccount } from "../../store/account/AccountContext";
import { LeaseDetailsDTO, LeaseInvitationDetailsDTO } from "../../models/lease";
import { isTokenExpired, navigateToAuth } from "../../services/authService";

export default function InvitationDetails() {
  const { invitationToken } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<LeaseInvitationDetailsDTO | null>(null);
  const [lease,setLease] = useState<LeaseDetailsDTO | null> (null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [notificationApi, contextHolder] = notification.useNotification();
  const { accountState, dispatchAccountState } = useAccount();
  const jwtToken = accountState.accountDetails?.token;
  
  const navigateToAuthFromInvitation = (nextApp: string = "tenant-manager", phone?: string): boolean => {
        const redirected = navigateToAuth(
          nextApp,
          phone,
          invitationToken ? `/invitations/${invitationToken}` : undefined,
        );
        if (!redirected) {
          notificationApi.error({
            message: "Sign-in required",
            description: "Please sign in to view this invitation.",
          });
        }
        return redirected;
  };



  const loadInvitation = async () => {

    if (!invitationToken) {
      notificationApi.error({
        message: "Invitation missing",
        description: "The tenant invitation token was not provided.",
      });
      setLoading(false);
      return;
    }

    if(!jwtToken) {
      navigateToAuthFromInvitation();
      setLoading(false);
      return;
    }

    



    try {
      const data = await invitationApi.getByInvitationToken(invitationToken,jwtToken);
      setInvitation(data);

      if(data.leaseId)
      {
        const res = await leaseApi.getLeaseById(data.leaseId,jwtToken);
        setLease(res);
      }
    } catch (error: any) {
      notificationApi.error({
        message: error.message ?? "Unable to load invitation",
        description: error.details ?? "The invitation could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const details = accountState.accountDetails;
    if (!details) {
        if (!navigateToAuthFromInvitation()) {
          setLoading(false);
        }
        return;
    }
    if (isTokenExpired(details.token)) {
        notificationApi.error({
        message: "Session expired",
        description: "Your sign-in session has expired. Please sign in again.",
        });
        dispatchAccountState({ type: "LOGOUT" });
        if (!navigateToAuthFromInvitation()) {
          setLoading(false);
        }
        return;
    }

    loadInvitation();
  }, [invitationToken]);

  const handleAcceptInvitation = async () => {
    if (!jwtToken) {
      navigateToAuthFromInvitation();
      return;
    }

    if (!invitationToken) {
      notificationApi.error({
        message: "Invitation missing",
        description: "No invitation token was found to accept.",
      });
      return;
    }

    const userId = accountState.accountDetails?.userDetails?.id;
    if (!userId) {
      notificationApi.error({
        message: "User not found",
        description: "Your account details are missing, so we cannot accept this invitation.",
      });
      return;
    }

    const acceptedLeaseId = invitation?.leaseId;
    setAccepting(true);
    try {
      await invitationApi.acceptInvitation(invitationToken, userId, jwtToken);
      notificationApi.success({
        message: "Invitation accepted",
        description: "Your lease details are now available.",
      });
      navigate(acceptedLeaseId ? `/leases/${acceptedLeaseId}` : `/`);
    } catch (error: any) {
      notificationApi.error({
        message: error?.message ?? "Failed to accept invitation",
        description: error?.data ?? "The invitation could not be accepted.",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        {contextHolder}
         <Result
            status="warning"
            title="Invitation not found or expired"
            extra={
              <Button type="primary" key="console">
                Go Home
              </Button>
            }
          />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24, display: "grid", placeItems: "center" }}>
      {contextHolder}
      <Card 
        title="Invitation Details"
        style={{ maxWidth: 760, width: "100%" }}
        >
        <Descriptions column={1} bordered style={{ marginTop: 20 }}>
          <Descriptions.Item label="Start Date">{lease?.startDate}</Descriptions.Item>
          <Descriptions.Item label="End Date">{lease?.endDate}</Descriptions.Item>
          <Descriptions.Item label="Rental Amount">{lease?.rent.amount} {lease?.rent.currency}</Descriptions.Item>
          <Descriptions.Item label="Rental Period">{lease?.rent.frequency}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={invitation.status === "PENDING" ? "gold" : "green"}>{invitation.status}</Tag>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" size="large" loading={accepting} onClick={handleAcceptInvitation}>
            Accept invitation
          </Button>
        </div>
      </Card>
    </div>
  );
}
