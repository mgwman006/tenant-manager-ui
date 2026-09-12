import React, { useEffect, useState } from "react";
import { Card, Typography, Button, notification, Result, Avatar, Tabs, Spin, Row, Col, Alert } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from "../store/account/AccountContext";
import { AccountState, TenantDetailsDTO, TenantInvitationDetailsDTO } from "../models/user";
import { UserOutlined, CalendarOutlined, DollarOutlined, FieldTimeOutlined, EditFilled, PlusCircleOutlined, PlusOutlined, SmileOutlined } from "@ant-design/icons";
import { LeaseDetailsDTO } from "../models/lease";
import { tenantApi } from "../api/api";
import Leases from "./lease/Leases";
import Invitations from "./invitation/Invitations";


const { Title, Text } = Typography;

const authUrl = import.meta.env.VITE_AUTH_URL?.trim();
const tenantManagerUrl = import.meta.env.VITE_TENANT_MANAGER_URL?.trim();

export default function HomePage() {
    const [searchParams] = useSearchParams();
    let accountStateString = searchParams.get("state");
    const [notificationApi, contextHolder] = notification.useNotification();
    const { accountState, dispatchAccountState } = useAccount();
    const [tenant, setTenant] = useState<TenantDetailsDTO|null>(null);
    const [loading, setLoading] = useState(false);


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

    const loadTenant = async (userId:number, jwtToken:string) =>
    {
        setLoading(true);
        try {
            const tenantResponse = await tenantApi.getByUserId(userId,jwtToken);
            setTenant(tenantResponse);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if(!accountStateString){
            accountStateString = JSON.stringify(accountState);
        }

        if (!accountStateString) {
            navigateToAuth();
            return;
        }

        try {
            const receivedAccountState: AccountState = JSON.parse(accountStateString);
            const details = receivedAccountState.accountDetails;
            if (!details) {
                navigateToAuth();
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

            loadTenant(details.userDetails.id,details.token);
             
        
        } catch (error) {
            console.error("Failed to parse account state from URL", error);
        }
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" tip="Loading your account..." />
            </div>
        );
    }

    if(!tenant){
        return (
            <Alert
                title="Error"
                description="tenant is not defined"
                type="error"
                showIcon
            />
        );
    }

  return (
        <>
            {contextHolder}
            <Row justify={"center"} align="middle">
                <Col xs ={24} sm={24} md={16} lg={16} style={{alignItems:"center"}} >
                    <Result
                        icon={<UserOutlined />}
                        title={tenant.firstName+" "+tenant.lastName}
                        extra={tenant.phoneNumber}
                    />
                </Col>
                <Col xs ={24} sm={24} md={16} lg={16}>
                    <Tabs
                        defaultActiveKey="1"
                        centered
                        items={[
                            {
                                key: '1',
                                label: 'Leases',
                                children: <Leases tenantId={tenant.id} jwtToken={accountState.accountDetails?.token} />,
                            },
                            {
                                key: '2',
                                label: 'Invitations',
                                children: <Invitations phoneNumber={tenant.phoneNumber} jwtToken={accountState.accountDetails?.token} />,
                            }
                        ]}
                    />
                </Col>
            </Row>
        </>
  );
}
