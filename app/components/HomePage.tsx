import { useEffect, useState } from "react";
import { Card, Typography, notification, Avatar, Tabs, Spin, Row, Col, Flex, Modal, Badge } from "antd";
import { useSearchParams } from "react-router-dom";
import { useAccount } from "../store/account/AccountContext";
import { AccountState, TenantDetailsDTO } from "../models/user";
import { EyeOutlined, BellOutlined, RightOutlined } from "@ant-design/icons";
import { LeaseStatus } from "../models/lease";
import Leases from "./lease/Leases";
import ViewingBookings from "./lease/ViewingBookings";
import Invitations from "./invitation/Invitations";
import { getActiveInvitations } from "../services/invitationService";
import { useTenant } from "../store/tenant/TenantContext";
import { isTokenExpired, navigateToAuth } from "../services/authService";
import { getTenantByUserId } from "../services/tenantService";
import { getViewingBookingsByRequester } from "../services/viewingService";

const {Meta} = Card;


export default function HomePage() {
    const [searchParams] = useSearchParams();
    let accountStateString = searchParams.get("state");
    const [notificationApi, contextHolder] = notification.useNotification();
    const { accountState, dispatchAccountState } = useAccount();
    const [tenant, setTenant] = useState<TenantDetailsDTO|null>(null);
    const [loading, setLoading] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isViewingBookingsOpen, setIsViewingBookingsOpen] = useState(false);
    const [invitesCount,setInvitesCount] = useState<number>(0);
    const [viewingBookingsCount, setViewingBookingsCount] = useState<number>(0);
    const [activeLeaseTab, setActiveLeaseTab] = useState("active");
    const { dispatchTenantState } = useTenant();


     

    const loadTenant = async (userId:number, jwtToken:string) =>
    {
        setLoading(true);
        const tenantResponse = await getTenantByUserId(userId, jwtToken, notificationApi);
        setTenant(tenantResponse);
        dispatchTenantState({ type: "FETCH_SUCCESS", payload: tenantResponse });
        setLoading(false);
    }

    const loadInvitations = async (phoneNumber:string,token : string) =>
    {
        const invites = await getActiveInvitations(phoneNumber,token,notificationApi);
        setInvitesCount(invites.length)
    }

    useEffect(() => {
        if(!accountStateString){
            accountStateString = JSON.stringify(accountState);
        }

        if (!accountStateString) {
            navigateToAuth("tenant-manager",accountState.accountDetails?.phoneNumber);
            return;
        }
       
        const receivedAccountState: AccountState = JSON.parse(accountStateString);
        const details = receivedAccountState.accountDetails;
        if (!details) {
            navigateToAuth("tenant-manager",accountState.accountDetails?.phoneNumber);
            return;
        }

        if (isTokenExpired(details.token)) {
            notificationApi.error({
            message: "Session expired",
            description: "Your sign-in session has expired. Please sign in again.",
            });
            dispatchAccountState({ type: "LOGOUT" });
            navigateToAuth("tenant-manager",accountState.accountDetails?.phoneNumber);

            return;
        }

        if (!accountState.accountDetails || accountState.accountDetails.token !== details.token) {
            dispatchAccountState({ type: "FETCH_SUCCESS", payload: details });
        }

        loadTenant(details.userDetails.id,details.token);
        
    }, []);

    useEffect(() => {
    const token = accountState.accountDetails?.token;
    const phoneNumber = accountState.accountDetails?.userDetails.phoneNumber;

    if (!phoneNumber || !token) {
        navigateToAuth("tenant-manager",accountState.accountDetails?.phoneNumber);
        return;
    }

    loadInvitations(phoneNumber, token);
}, [tenant?.phoneNumber, accountState.accountDetails?.token]);

    useEffect(() => {
        const requesterUserId = accountState.accountDetails?.id;
        const token = accountState.accountDetails?.token;
        if (!requesterUserId || !token) {
            setViewingBookingsCount(0);
            return;
        }

        let active = true;
        getViewingBookingsByRequester(requesterUserId, token, notificationApi).then((bookings) => {
            if (active && bookings) {
                setViewingBookingsCount(bookings.length);
            }
        });

        return () => {
            active = false;
        };
    }, [accountState.accountDetails?.id, accountState.accountDetails?.token]);

    const summaryCards = [
        {
            title: "Invitations",
            value: `${invitesCount} invitations`,
            icon: <Badge count={invitesCount}><BellOutlined /></Badge>,    
            color: "#EDF4FF",
            onClick: () => setIsInviteModalOpen(true),
        },
        {
            title: "Viewing bookings",
            value: `${viewingBookingsCount} viewing bookings`,
            icon: <Badge count={viewingBookingsCount}><EyeOutlined /></Badge>,
            color: "#F5F8FC",
            onClick: () => setIsViewingBookingsOpen(true),
        }
       
    ];

    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" tip="Loading your account..." />
            </div>
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
                    <Col xs={24} sm={12} md={12} key={card.title}>
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
                title="Invitations"
                open={isInviteModalOpen}
                onCancel={() => setIsInviteModalOpen(false)}
                footer={null}
                width={{
                    xs: '100%',
                    sm: '90%',
                    md: '80%',
                    lg: '50%',
                    xl: '50%',
                    xxl: '50%',
                }}
            >
                <Invitations phoneNumber={accountState.accountDetails?.userDetails.phoneNumber ?? ""} jwtToken={accountState.accountDetails?.token} />
            </Modal>

            <Modal
                title="Viewing bookings"
                open={isViewingBookingsOpen}
                onCancel={() => setIsViewingBookingsOpen(false)}
                footer={null}
                destroyOnHidden
                width={{ xs: "96%", sm: "90%", md: 760 }}
            >
                <ViewingBookings
                    requesterUserId={accountState.accountDetails?.id}
                    token={accountState.accountDetails?.token}
                />
            </Modal>
      
            <Row 
                // justify={"center"}
                //  align="middle"
            >

                <Col xs ={24} sm={24} md={24} lg={24}>
                    <div id="lease-list">
                    <Tabs
                        activeKey={activeLeaseTab}
                        onChange={setActiveLeaseTab}
                        centered
                        items={[
                            {
                                key: 'active',
                                label: 'Active Leases',
                                children: activeLeaseTab === "active"
                                    ? <Leases key="active" tenantId={tenant?.id ?? 0} jwtToken={accountState.accountDetails?.token} status={LeaseStatus.ACTIVE} />
                                    : null,
                            },
                            {
                                key: 'ended',
                                label: 'Ended',
                                children: activeLeaseTab === "ended"
                                    ? <Leases key="ended" tenantId={tenant?.id ?? 0} jwtToken={accountState.accountDetails?.token} status={LeaseStatus.ENDED} />
                                    : null,
                            },
                        ]}
                    />
                    </div>
                </Col>
            </Row>
        </>
  );
}
