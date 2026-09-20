import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Breadcrumb, Button, Card, Col, Descriptions, Flex, Form, Input, notification, Progress, Result, Row, Spin, Typography } from "antd";
import { leaseApi } from "../../api/api";
import { LeaseDetailsDTO, RentSummaryDTO } from "../../models/lease";
import { useAccount } from "../../store/account/AccountContext";
import { getRentSummary, getLease } from "../../services/leaseService";
import { UserOutlined, CalendarOutlined, DollarOutlined, FieldTimeOutlined, EditFilled, PlusCircleOutlined, PlusOutlined, SmileOutlined, HomeTwoTone, BookOutlined, ArrowRightOutlined, TeamOutlined, RightOutlined, BellOutlined, WalletFilled, PayCircleOutlined, ScheduleOutlined, CreditCardOutlined, ArrowLeftOutlined } from "@ant-design/icons";


const { Title, Text } = Typography;
const authUrl = import.meta.env.VITE_AUTH_URL?.trim();
const tenantManagerUrl = import.meta.env.VITE_TENANT_MANAGER_URL?.trim();

export default function RentSummary() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState<LeaseDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationApi, contextHolder] = notification.useNotification();
  const { accountState } = useAccount();
  const [rentSummary,setRentSummary] = useState<RentSummaryDTO|null>();

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

  
  const loadAcceptedLease = async (jwtToken:string) => {
    const leaseDetails = await getLease(Number(leaseId), jwtToken, notificationApi);
    setLease(leaseDetails);
  }

  const loadRentPaymentOutstanding = async (jwtToken:string) => {
    const rentPayment = await getRentSummary(Number(leaseId), jwtToken, notificationApi);
    setRentSummary(rentPayment);
  }
  
  useEffect(() => {
    const loadLeaseDetails = async () => {
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

      
      loadAcceptedLease(jwtToken);
      loadRentPaymentOutstanding(jwtToken);
      setLoading(false);
    };

    void loadLeaseDetails();
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

  if(!rentSummary)
  {
    return <div>{contextHolder}error</div>;
  }

  const fullyPaid = rentSummary?.totalOutstandingAmount <= 0;
  const progressPercent = rentSummary?.totalExpectedAmount??0 > 0 ? Math.min((rentSummary?.totalPaidAmount  / rentSummary?.totalExpectedAmount) * 100, 100) : 0;


  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      {contextHolder}
      <Button color="geekblue" onClick={() => navigate(-1)}><ArrowLeftOutlined/> Back</Button>


      <Row>
        <Col span={24}>
          <Card title="Rent Summary" style={{ maxWidth: 760 }}>
              <Descriptions
                size="small"
                column={1}
                layout="horizontal"
              >
              
                <Descriptions.Item label="Total Rent Amount (TZS)">
                  {rentSummary.totalExpectedAmount}
                </Descriptions.Item>
                <Descriptions.Item label="Amount Paid (TZS)">
                  {rentSummary.totalPaidAmount}
                </Descriptions.Item>
                <Descriptions.Item label="Outstanding Amount (TZS)">
                  {rentSummary.totalOutstandingAmount}
                </Descriptions.Item>
              
              </Descriptions>

              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={Math.round(progressPercent)}
                  showInfo
                  strokeColor={fullyPaid ? "#52c41a" : "#1677ff"}
                  trailColor="#e6f4ff"
                  format={(percent) => `${percent}%`}
                />
              </div>
          </Card>
        </Col>
      </Row>

      {
        rentSummary.paymentBlocks.length==0 ? (
          <Alert
            title="No payment blocks allocated for this lease"
            type={"error"}
            showIcon
            style={{ marginBottom: 24, whiteSpace: "normal" }}
          />
        ):
        fullyPaid ? (
           <Result
              status="success"
              title="You are sorted"
              subTitle="There is not pending payment"
            />
        )
        : (
          <Row>
            <Col span={24}>
              <Card 
                title="Rent payment"
                style={{ maxWidth: 760, width: "100%" }}>

                  <Alert
                    title={lease.fullLeasePaymentRequired
                      ? "Your landlord is requesting full payment for this lease"
                      : "Month-to-month payment is allowed for this lease"}
                    type={lease.fullLeasePaymentRequired ? "warning" : "success"}
                    showIcon
                    style={{ marginBottom: 24, whiteSpace: "normal" }}
                  />

                  <Form
                    name="customized_form_controls"
                    layout="vertical"
                    //onFinish={onFinish}
                    initialValues={{
                     // amount: rentPaymentOutstanding.fullLeasePaymentRequired?rentPaymentOutstanding.outstandingAmount:rentPaymentOutstanding.rentAmount,
                    }}
                  >
                    <Form.Item name="amount">
                      <Input 
                        suffix="TZS" 
                      //  disabled={rentPaymentOutstanding.fullLeasePaymentRequired}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        <CreditCardOutlined /> Pay Rent
                      </Button>
                    </Form.Item>
                  </Form>

          
              </Card>
            </Col>
          </Row>
        )

      }
      
    </div>
  );
}
