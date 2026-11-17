import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Descriptions, Form, Input, Modal, notification, Progress, Radio, Result, Row, Spin, Table, TableProps, Tag } from "antd";
import { LeaseDetailsDTO, PaymentBlockStatus, PaymentBlockSummaryDTO, RentSummaryDTO } from "../../models/lease";
import { useAccount } from "../../store/account/AccountContext";
import { getRentSummary, getLease } from "../../services/leaseService";
import { CreditCardOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { PaymentMethod, PaymentTransactionCreateDTO } from "../../models/payments";
import { recordPayment } from "../../services/paymentService";
import { navigateToAuth } from "../../services/authService";


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
  const [paymentSaving, setPaymentSaving] = useState(false);

  const openPaymentTransactionModal = (paymentBlockId:number, amount:number) =>{
        setIsPaymentModalOpen(true);
        setSelectedPaymentBlockId(paymentBlockId);
        setSelectedAmount(amount);
        paymetTransactionForm.setFieldsValue({
          paymentBlockId,
          amount,
          currency: "TZS",
          payerUserId: accountState.accountDetails?.userDetails.id ?? 0,
          method: PaymentMethod.CASH,
        });
  }

  const handleOnFinishPaymentForm = async (values:PaymentTransactionCreateDTO) => {
        const tenantId = lease?.tenant?.id;

        if(!tenantId){
            notificationApi.error({
                description:`Tenant Id value is ${tenantId}`,
                message:"Invalid Tenant Id"
            });
            return;
        }
          setPaymentSaving(true);
          try {
            const result = await recordPayment(
              values,
              tenantId,
              accountState.accountDetails?.token ?? "",
              notificationApi,
            );
            if (result !== null) {
              setIsPaymentModalOpen(false);
              const summary = await getRentSummary(
                Number(leaseId),
                accountState.accountDetails?.token ?? "",
                notificationApi,
              );
              setRentSummary(summary);
            }
          } finally {
            setPaymentSaving(false);
          }
    }
  
    useEffect(() => {
      let active = true;
      const loadLeaseDetails = async () => {
        const jwtToken = accountState.accountDetails?.token;
        if (!jwtToken) {
          const redirected = navigateToAuth("tenant-manager", undefined, `/leases/rent/${leaseId}`);
          if (!redirected) {
            notificationApi.error({
              message: "Sign-in required",
              description: "Please sign in to view rent and payment details.",
            });
            setLoading(false);
          }
          return;
        }

        if (!leaseId || !Number.isInteger(Number(leaseId)) || Number(leaseId) <= 0) {
          notificationApi.error({
            message: "Invalid lease link",
            description: "The lease ID in this address is not valid.",
          });
          if (active) {
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const [leaseDetails, rentPayment] = await Promise.all([
          getLease(Number(leaseId), jwtToken, notificationApi),
          getRentSummary(Number(leaseId), jwtToken, notificationApi),
        ]);
        if (active) {
          setLease(leaseDetails);
          setRentSummary(rentPayment);
          setLoading(false);
        }
      };

      void loadLeaseDetails();
      return () => {
        active = false;
      };
    }, [accountState.accountDetails?.token, leaseId]);

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
    return (
      <div style={{ maxWidth: 900, margin: "24px auto" }}>
        {contextHolder}
        <Result
          status="warning"
          title="Payment details are unavailable"
          subTitle="We couldn't load the payment schedule for this lease."
          extra={<Button onClick={() => navigate(`/leases/${leaseId}`)}>View lease details</Button>}
        />
      </div>
    );
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
        title: "Due Date",
        dataIndex: "dueDate",
        key: "dueDate",
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
            <Button onClick={() => openPaymentTransactionModal(record.id,record.outstandingAmount)} color="primary" variant="solid" disabled={record.status === PaymentBlockStatus.PAID || record.outstandingAmount <= 0}> <CreditCardOutlined/> Record Payment</Button>
        ),
    },
];
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "clamp(12px, 3vw, 24px)" }}>
      {contextHolder}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Button color="geekblue" onClick={() => navigate(`/leases/${leaseId}`)}>
          <ArrowLeftOutlined /> Lease details
        </Button>
      </div>


      <Row>
        <Col span={24}>
          <Card title={`Rent & payment${lease?.referenceNumber ? ` · ${lease.referenceNumber}` : ""}`} style={{ width:"100%", borderRadius: 16 }}>
              <Descriptions
                size="small"
                column={1}
                layout="horizontal"
              >
              
                <Descriptions.Item label="Total Rent Amount (TZS)">
                  {new Intl.NumberFormat("en-TZ").format(rentSummary.totalExpectedAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="Amount Paid (TZS)">
                  {new Intl.NumberFormat("en-TZ").format(rentSummary.totalPaidAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="Outstanding Amount (TZS)">
                  {new Intl.NumberFormat("en-TZ").format(rentSummary.totalOutstandingAmount)}
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
        rentSummary.paymentBlocks.length === 0 ? (
          <Alert
            title="No payment blocks allocated for this lease"
            type={"error"}
            showIcon
            style={{ marginBottom: 24, whiteSpace: "normal" }}
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

                  {fullyPaid && (
                    <Alert
                      title="All rent payments are up to date"
                      type="success"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

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
                                    method: PaymentMethod.CASH,
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
                                    <Radio.Button value={PaymentMethod.CASH}>Cash</Radio.Button>
                                    <Radio.Button value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</Radio.Button>
                                    <Radio.Button value={PaymentMethod.MOBILE_MONEY}>Mobile Money</Radio.Button>
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
                                    <Button variant="solid" block type="primary" htmlType="submit" color="green" loading={paymentSaving}>Submit</Button>
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
