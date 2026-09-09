import React, { useEffect, useState } from "react";
import { Card, Typography, Button, notification, Result, Avatar, Tabs } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from "../store/account/AccountContext";
import { AccountState, TenantInvitationDetailsDTO } from "../models/user";
import { UserOutlined, CalendarOutlined, DollarOutlined, FieldTimeOutlined, EditFilled, PlusCircleOutlined, PlusOutlined, SmileOutlined } from "@ant-design/icons";
import { LeaseDetailsDTO } from "../models/lease";


const { Title, Text } = Typography;

const authUrl = import.meta.env.VITE_AUTH_URL?.trim();
const tenantManagerUrl = import.meta.env.VITE_TENANT_MANAGER_URL?.trim();

export default function HomePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const accountStateString = searchParams.get("state");
    const [notificationApi, contextHolder] = notification.useNotification();
    const { accountState, dispatchAccountState } = useAccount();
    const [leases,setLeases] = useState<LeaseDetailsDTO[]>([]);
    const [invitations,setInvitations] = useState<TenantInvitationDetailsDTO[]>([]);
    const [tenant, setTenant] = useState<LeaseDetailsDTO|null>(null);


    function isTokenExpired(token?: string): boolean 
    {
        if (!token) 
        {
            return true;
        }

        try {
            const parts = token.split(".");
            if (parts.length < 2) {return true;}

            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            const exp = payload?.exp;

            if (typeof exp !== "number") {
                return true;
            }

            return Date.now() >= exp * 1000;
        } catch (error) {
            return true;
        }
    }

    const navigateToAuth = (nextApp: string = "tenant-manager", phone?: string) => {
        if (!authUrl) {
            notificationApi.error({
            message: "Error while reading url",
            description: "VITE_AUTH_URL is not configured.",
            });
            return;
        }

        const outGoingUrlValue = nextApp === "tenant-manager" ? tenantManagerUrl : null;
        if (!outGoingUrlValue) {
            console.error("Unable to resolve outgoing URL for auth redirect.");
            return;
        }

        const url = `${authUrl}?outGoingUrl=${encodeURIComponent(outGoingUrlValue)}&phoneNumber=${encodeURIComponent("")}`;
        window.location.href = url;
    };

    useEffect(() => {
        if (!accountStateString) {
            navigateToAuth();
            return;
        }

        try {
            const receivedAccountState: AccountState = JSON.parse(accountStateString);
            const details = receivedAccountState.accountDetails;
            if (!details) {
                console.error("Account state payload is missing accountDetails");
                return;
            }

            if (isTokenExpired(details.token)) {
                notificationApi.error({
                message: "Session expired",
                description: "Your sign-in session has expired. Please sign in again.",
                });
                dispatchAccountState({ type: "LOGOUT" });
                navigateToAuth();
                return;
            }

            if (!accountState.accountDetails || accountState.accountDetails.token !== details.token) {
                dispatchAccountState({ type: "FETCH_SUCCESS", payload: details });
            }

        
        } catch (error) {
            console.error("Failed to parse account state from URL", error);
        }
    }, []);

  return (
    <Card style={{ maxWidth: 720, margin: "40px auto" }}>
      <Result
            style={{color:"black"}}
            icon={<Avatar size="large" icon={<UserOutlined />} />}
            title={accountState.accountDetails?.userDetails.firstName}
            subTitle={accountState.accountDetails?.userDetails.phoneNumber}
            extra={<Tabs
                    defaultActiveKey="1"
                    centered
                    items={[
                            {
                                key: '1',
                                label: 'Leases',
                                children: 'Content of Tab Pane 1',
                            },
                            {
                                key: '2',
                                label: 'Invitations',
                                children: 'Content of Tab Pane 2',
                            }
                        ]}
                />}
       />

    </Card>
  );
}
