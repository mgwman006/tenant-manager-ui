import React, { useEffect, useState } from "react";
import { Card, Typography, Button, notification, Result, Avatar, Tabs, Spin, Row, Col, Alert, Flex, Modal, Form, InputNumber, Input, Select, Radio, Badge } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAccount } from "../store/account/AccountContext";
import { AccountState, TenantDetailsDTO, TenantInvitationDetailsDTO } from "../models/user";
import { UserOutlined, CalendarOutlined, DollarOutlined, FieldTimeOutlined, EditFilled, PlusCircleOutlined, PlusOutlined, SmileOutlined, HomeTwoTone, BookOutlined, ArrowRightOutlined, TeamOutlined, RightOutlined, BellOutlined, WalletFilled, PayCircleOutlined, ScheduleOutlined, CreditCardOutlined } from "@ant-design/icons";
import { LeaseCreateDTO, LeaseDetailsDTO } from "../models/lease";
import { tenantApi } from "../api/api";
import Leases from "./lease/Leases";
import Invitations from "./invitation/Invitations";
import { createLease } from "../services/leaseService";
import { getActiveInvitations } from "../services/invitationService";

const {Meta} = Card;


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
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [leaseForm] = Form.useForm<LeaseCreateDTO>();
    const [invitesCount,setInvitesCount] = useState<number>(0);
    const [activeLeaseAmountDue,setActiveLeaseAmountDue] = useState<number>(0);
    const [invitations, setInvitations] = useState<TenantInvitationDetailsDTO[]>([]);

    const summaryCards = [
        {
            title: "Initiate Lease",
            value: "Invite your landlord to start agreement",
            icon: <PlusOutlined />,
            color: "#FAFFFA",
            buttonStyle: { backgroundColor: "#52c41a", borderColor: "#52c41a", color: "#fff" },
            buttonText: "Create Lease",
            buttonIcon: <PlusOutlined />,
            onClick: () => setIsLeaseModalOpen(true),
        },
         {
            title: "Invitations",
            value: `You have ${invitesCount} invitaions to respond`,
            icon: <Badge count={invitesCount}><BellOutlined /></Badge>,    
            color: "#EDF4FF",
            buttonStyle: { backgroundColor: "info", borderColor: "#EDF4FF", color: "#fff" },
            buttonText: "View more",
            buttonIcon: <ArrowRightOutlined />,
            onClick: () => setIsInviteModalOpen(true),
        },
        {
            title: "Amount Due",
            value: activeLeaseAmountDue,
            icon: <ScheduleOutlined />,
            color: "#FFFCFC",
            buttonStyle: { backgroundColor: "info", borderColor: "#EDF4FF", color: "#fff" },
            buttonText: "Pay now",
            buttonIcon: <PayCircleOutlined />,
            onClick: () => {},
        },
        {
            title: "Lease Fund",
            value: invitesCount,
            icon: <CreditCardOutlined />,
            color: "#FFFFED",
            buttonStyle: { backgroundColor: "info", borderColor: "#EDF4FF", color: "#fff" },
            buttonText: "Load Fund",
            buttonIcon: <ArrowRightOutlined />,
            onClick: () => {},
        }
       
    ];

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

    const handleCreateLease = async (values: LeaseCreateDTO) => 
    {
        const tenantId = tenant?.id;
        const token = accountState.accountDetails?.token;
        if (!token || !tenantApi) {
            notificationApi.error({
                message: "Authentication Required",
                description: "Please sign in again to create a lease.",
            });
            navigateToAuth("tenant-manager",tenant?.phoneNumber)
            return;
        }
        const newLease: LeaseCreateDTO = {
            ...values,
            tenantId: tenantId,
        };

        const response = await createLease(newLease, token,notificationApi);
        setIsLeaseModalOpen(false);
    };

    const loadInvitations = async (tokeb : string) =>
    {
        const invites = await getActiveInvitations(tenant?.phoneNumber??"",tokeb ?? "",notificationApi);
        setInvitesCount(invites.length)
        setInvitations(invitations);
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
            loadInvitations(details.token);

            ;

             
        
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
            <Row style={{marginTop:24}}>
                <Col span={24}>
                    <Card variant="borderless">
                        <Meta 
                            title={`Good day, ${accountState.accountDetails?.userDetails.firstName}`}
                            description={"Here is your rental overview. Stay on top of your rent and manage your lease"}
                        />
                    </Card>
                </Col>
            </Row>


            <Row gutter={[16, 16]} style={{ marginBottom: 24 , marginTop:24}}>
                {summaryCards.map((card) => (
                    <Col xs={24} sm={12} md={6} key={card.title}>
                        <Card 
                            onClick={card.onClick}
                            hoverable 
                            style={{ borderRadius: 16, border: "1px solid #eaf0f6", boxShadow: "none", backgroundColor:card.color }} 
                        >
                            <Flex
                                justify="space-between"
                            >

                                <Meta 
                                    avatar={<Avatar size={50} icon={card.icon}/>}
                                    title={card.title}
                                    description={card.value}
                                />
                                <RightOutlined />
                            </Flex>
                            
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title="Initiate a lease"
                open={isLeaseModalOpen}
                onCancel={() => setIsLeaseModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsLeaseModalOpen(false)}>
                        Close
                    </Button>,
                ]}
            >
                <Form
                    form={leaseForm}
                    layout="vertical"
                    onFinish={async (values) => {handleCreateLease(values);}}
                >
                    <Form.Item
                        hidden={true}
                        name="rentalProfileId"
                        label="Rental Profile ID"
                        rules={[{ required: false, message: "Please enter the rental profile ID" }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        hidden={true}
                        name="unitId"
                        label="Unit ID"
                        rules={[{ required: false, message: "Please enter the unit ID" }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        hidden={true}
                        name="tenantId"
                        label="Tenant ID"
                        rules={[{ required: false, message: "Please enter the tenant ID" }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="landlordFirstName"
                        label="Landlord First Name"
                        rules={[{ required: true, message: "Please enter the landlord's first name" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="landlordLastName"
                        label="Landlord Last Name"
                        rules={[{ required: true, message: "Please enter the landlord's last name" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="landlordPhoneNumber"
                        label="Landlord Phone Number"
                        rules={[{ required: true, message: "Please enter the landlord's phone number" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="startDate"
                        label="Start Date"
                        rules={[{ required: true, message: "Please enter the lease start date" }]}
                    >
                        <Input type="date"/>
                    </Form.Item>

                    <Form.Item
                        name="endDate"
                        label="End Date"
                        rules={[{ required: true, message: "Please enter the lease end date" }]}
                    >
                        <Input type="date" />
                    </Form.Item>

                    <Form.Item
                        name="rentAmount"
                        label="Rent Amount"
                        rules={[{ required: true, message: "Please enter the rent amount" }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="currency"
                        label="Currency"
                        rules={[{ required: true, message: "Please enter the currency" }]}
                    >
                        <Select
                        options={[
                            { value: "TZS", label: "TZS" },
                            // { value: "USD", label: "USD" },
                            // { value: "EUR", label: "EUR" },
                            // Add more currencies as needed
                        ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="rentFrequency"
                        label="Rent Frequency"
                        rules={[{ required: true, message: "Please select the rent period" }]}
                    >
                        <Select
                        options={[
                            { value: "DAILY", label: "Daily" },
                            { value: "WEEKLY", label: "Weekly" },
                            { value: "MONTHLY", label: "Monthly" },
                            { value: "YEARLY", label: "Yearly" },
                        ]}
                        />
                    </Form.Item>

                    <Form.Item
                        hidden={true}
                        name="fullLeasePaymentRequired"
                        label="Do you need full payment"
                        initialValue={false}
                        rules={[{ required: true, message: "Please select whether full payment is required" }]}
                    >
                        <Radio.Group buttonStyle="solid">
                            <Radio.Button value={true}>Yes</Radio.Button>
                            <Radio.Button value={false}>No</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Create Lease <RightOutlined />
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Invitations"
                open={isInviteModalOpen}
                onCancel={() => setIsInviteModalOpen(false)}
                footer={null}
            >
                <Invitations phoneNumber={tenant.phoneNumber} jwtToken={accountState.accountDetails?.token} />
            </Modal>
      
            <Row 
                // justify={"center"}
                //  align="middle"
            >

                <Col xs ={24} sm={24} md={24} lg={24}>
                    <Tabs
                        defaultActiveKey="1"
                        centered
                        items={[
                            {
                                key: '1',
                                label: 'Active Leases',
                                children: <Leases tenantId={tenant.id} jwtToken={accountState.accountDetails?.token} />,
                            },
                            {
                                disabled:true,
                                key: '2',
                                label: 'Pending Leases',
                                // children: <Invitations phoneNumber={tenant.phoneNumber} jwtToken={accountState.accountDetails?.token} />,
                            },
                            {
                                disabled:true,
                                key: '3',
                                label: 'Expired Leases',
                                // children: <Invitations phoneNumber={tenant.phoneNumber} jwtToken={accountState.accountDetails?.token} />,
                            }
                        ]}
                    />
                </Col>
            </Row>
        </>
  );
}
