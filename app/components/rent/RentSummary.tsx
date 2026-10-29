import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Breadcrumb, Button, Card, Col, Descriptions, Flex, Form, Input, Modal, notification, Progress, Radio, Result, Row, Spin, Table, TableProps, Tag, Typography } from "antd";
import { leaseApi } from "../../api/api";
import { LeaseDetailsDTO, PaymentBlockStatus, PaymentBlockSummaryDTO, RentSummaryDTO } from "../../models/lease";
import { useAccount } from "../../store/account/AccountContext";
import { getRentSummary, getLease } from "../../services/leaseService";
import { UserOutlined, CalendarOutlined, DollarOutlined, FieldTimeOutlined, EditFilled, PlusCircleOutlined, PlusOutlined, SmileOutlined, HomeTwoTone, BookOutlined, ArrowRightOutlined, TeamOutlined, RightOutlined, BellOutlined, WalletFilled, PayCircleOutlined, ScheduleOutlined, CreditCardOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { PaymentTransactionCreateDTO } from "../../models/payments";
import { recordPayment } from "../../services/paymentService";


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
  const [isPaymentModalOpen,setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymetTransactionForm] = Form.useForm<PaymentTransactionCreateDTO>();
  const [selectedPaymentBlockId,setSelectedPaymentBlockId] = useState<number>(0);
  const [selectedAmount,setSelectedAmount] = useState<number>(0);

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

  const openPaymentTransactionModal = (paymentBlockId:number, amount:number) =>{
        setIsPaymentModalOpen(true);
        setSelectedPaymentBlockId(paymentBlockId);
        setSelectedAmount(amount);
  }

  const handleOnFinishPaymentForm = (values:PaymentTransactionCreateDTO) => {
        const tenantId = lease?.tenant?.id;

        if(!tenantId){
            notificationApi.error({
                description:`Tenant Id value is ${tenantId}`,
                message:"Invalid Tenant Id"
            });
            return;
        }
        setLoading(true);
        recordPayment(values,tenantId,accountState.accountDetails?.token ?? "",notificationApi);
        setIsPaymentModalOpen(false);
        setLoading(false);
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
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  

  if(!rentSummary)
  {
    return <div>{contextHolder}error</div>;
  }

  const fullyPaid = rentSummary?.totalOutstandingAmount <= 0;
  const progressPercent = rentSummary?.totalExpectedAmount??0 > 0 ? Math.min((rentSummary?.totalPaidAmount  / rentSummary?.totalExpectedAmount) * 100, 100) : 0;


  const columns: TableProps<PaymentBlockSummaryDTO>["columns"] = [
    {
        title: "Start Date",
        dataIndex: "startDate",
        key: "startDate",
    },
    {
        title: "End Date",
        dataIndex: "endDate",
        key: "endDate",
    },
    {
        title: "Amount (TZS)",
        dataIndex: "amount",
        key: "amount",
        render: (amount: number) =>
            `${new Intl.NumberFormat("en-TZ").format(amount)}`,
    },
    {
        title: "Paid Amount (TZS)",
        dataIndex: "paidAmount",
        key: "paidAmount",
        render: (paidAmount: number) =>
            `${new Intl.NumberFormat("en-TZ").format(paidAmount)}`,
    },
    {
        title: "Outstanding Amount (TZS)",
        dataIndex: "outstandingAmount",
        key: "outstandingAmount",
        render: (outstandingAmount: number) =>
            `${new Intl.NumberFormat("en-TZ").format(outstandingAmount)}`,
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
            <Tag color={status === PaymentBlockStatus.UNPAID ? "red" : "green"} variant="solid">
                {status}
            </Tag>
        ),
    },
    {
        title: "Action",
        render: (_, record) => (
            <Button onClick={() => openPaymentTransactionModal(record.id,record.amount)} color="primary" variant="solid" disabled={record.status === PaymentBlockStatus.PAID}> <CreditCardOutlined/> Record Payment</Button>
        ),
    },
];
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      {contextHolder}
      <Button color="geekblue" onClick={() => navigate(-1)}><ArrowLeftOutlined/> Back</Button>


      <Row>
        <Col span={24}>
          <Card title="Rent Summary" style={{ width:"100%" }}>
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
                style={{ width: "100%" }}>

                  <Alert
                    title={lease?.fullLeasePaymentRequired
                      ? "Your landlord is requesting full payment for this lease"
                      : "Month-to-month payment is allowed for this lease"}
                    type={lease?.fullLeasePaymentRequired ? "warning" : "success"}
                    showIcon
                    style={{ marginBottom: 24, whiteSpace: "normal" }}
                  />

                  <div style={{ overflowX: "auto", width: "100%", marginTop: 16 }}>
                        <Table<PaymentBlockSummaryDTO>
                            columns={columns}
                            dataSource={rentSummary.paymentBlocks}
                            rowKey="id"
                            pagination={false}
                            scroll={{ x: 640 }}
                            size="small"
                        />

                        <Modal
                            title="Record Payment"
                            centered
                            open={isPaymentModalOpen}
                            onCancel={() => setIsPaymentModalOpen(false)}
                            width={{
                            xs: '90%',
                            sm: '90%',
                            md: '60%',
                            lg: '50%',
                            xl: '50%',
                            xxl: '50%',
                            }}
                            footer={[null]}
                        >
                            <Form
                                size="large"
                                layout={'vertical'}
                                form={paymetTransactionForm}
                                initialValues={{ 
                                    paymentBlockId: selectedPaymentBlockId,
                                    method:"CASH",
                                    currency:"TZS",
                                    payerUserId:0,
                                    amount:selectedAmount
                                }}
                                onFinish={handleOnFinishPaymentForm}
                            >
                                <Form.Item 
                                    rules={[{ required: true }]}
                                    label="Payment Block Id" 
                                    name="paymentBlockId" 
                                    hidden>
                                    <Input />
                                </Form.Item>
                                
                                <Form.Item 
                                    rules={[{ required: true }]}
                                    label="User" 
                                    name="payerUserId" 
                                    hidden>
                                    <Input  />
                                </Form.Item>

                                <Form.Item         
                                    rules={[{ required: true }]}
                                    label="Amount" name="amount">
                                    <Input disabled type={'number'} suffix="TZS" />
                                </Form.Item>

                                <Form.Item         
                                    rules={[{ required: true }]}
                                    label="Currency" name="currency" hidden>
                                    <Input />
                                </Form.Item>

                                <Form.Item        
                                    rules={[{ required: true }]}
                                    label="Patment Method" name="method" >
                                    <Radio.Group buttonStyle="solid" >
                                    <Radio.Button value="CASH">Cash</Radio.Button>
                                    <Radio.Button value="BANK_TRANSFER">Bank Transfer</Radio.Button>
                                    <Radio.Button value="MOBILE_MONEY">Mobile Money</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>

                                <Form.Item      
                                    hidden   
                                    rules={[{ required: false }]}
                                    label="Reference" name="reference">
                                    <Input placeholder="input placeholder" />
                                </Form.Item>

                                <Form.Item label="Note (Optional)" name="note">
                                    <Input placeholder="Enter payment description" />
                                </Form.Item>

                                
                                <Form.Item>
                                    <Button variant="solid" block type="primary" htmlType="submit" color="green" loading={loading}>Submit</Button>
                                </Form.Item>
                            </Form>
                        </Modal>

                    </div>

          
              </Card>
            </Col>
          </Row>
        )

      }
      
    </div>
  );
}
