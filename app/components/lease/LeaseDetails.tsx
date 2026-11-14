import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Progress,
  Radio,
  Row,
  Spin,
  Table,
  Tag,
  Typography,
  type TableProps,
} from "antd";
import { ArrowLeftOutlined, CreditCardOutlined } from "@ant-design/icons";
import {
  LeaseDetailsDTO,
  LeaseStatus,
  PaymentBlockStatus,
  PaymentBlockSummaryDTO,
  RentSummaryDTO,
} from "../../models/lease";
import { PaymentMethod, PaymentTransactionCreateDTO } from "../../models/payments";
import { getLease, getRentSummary } from "../../services/leaseService";
import { navigateToAuth } from "../../services/authService";
import { recordPayment } from "../../services/paymentService";
import { useAccount } from "../../store/account/AccountContext";

const { Text, Title } = Typography;
const numberFormat = new Intl.NumberFormat("en-TZ");

const formatDate = (value?: string) => {
  if (!value) {
    return "Not provided";
  }
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(date);
};

const formatMoney = (value?: number, currency = "TZS") =>
  typeof value === "number" ? `${currency} ${numberFormat.format(value)}` : "Not available";

const formatRent = (lease: LeaseDetailsDTO) => {
  const rent = lease.rent;
  if (!rent || typeof rent.amount !== "number") {
    return "Rent details unavailable";
  }
  const frequency = rent.frequency
    ? ` per ${rent.frequency.replaceAll("_", " ").toLowerCase()}`
    : "";
  return `${formatMoney(rent.amount, rent.currency || "TZS")}${frequency}`;
};

export default function LeaseDetails() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const { accountState } = useAccount();
  const [notificationApi, contextHolder] = notification.useNotification();
  const [lease, setLease] = useState<LeaseDetailsDTO | null>(null);
  const [rentSummary, setRentSummary] = useState<RentSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{ blockId: number; amount: number } | null>(null);
  const [paymentForm] = Form.useForm<PaymentTransactionCreateDTO>();

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      if (!leaseId || !Number.isInteger(Number(leaseId)) || Number(leaseId) <= 0) {
        notificationApi.error({
          message: "Invalid lease link",
          description: "The lease ID in this address is not valid.",
        });
        setLoading(false);
        return;
      }

      const token = accountState.accountDetails?.token;
      if (!token) {
        const redirected = navigateToAuth("tenant-manager", undefined, `/leases/${leaseId}`);
        if (!redirected) {
          notificationApi.error({
            message: "Sign-in required",
            description: "Please sign in to view this lease.",
          });
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const [leaseDetails, paymentSummary] = await Promise.all([
        getLease(Number(leaseId), token, notificationApi),
        getRentSummary(Number(leaseId), token, notificationApi),
      ]);
      if (active) {
        setLease(leaseDetails);
        setRentSummary(paymentSummary);
        setLoading(false);
      }
    };

    void loadDetails();
    return () => {
      active = false;
    };
  }, [leaseId, accountState.accountDetails?.token]);

  const openPaymentModal = (blockId: number, amount: number) => {
    setSelectedPayment({ blockId, amount });
    paymentForm.setFieldsValue({
      paymentBlockId: blockId,
      amount,
      currency: lease?.rent?.currency || "TZS",
      payerUserId: accountState.accountDetails?.userDetails.id ?? 0,
      method: PaymentMethod.CASH,
    });
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (values: PaymentTransactionCreateDTO) => {
    const tenantId = lease?.tenant?.id;
    const token = accountState.accountDetails?.token;
    if (!tenantId || !token) {
      notificationApi.error({
        message: "Unable to record payment",
        description: "Tenant or sign-in details are unavailable. Please sign in again.",
      });
      return;
    }

    setPaymentSaving(true);
    try {
      const result = await recordPayment(values, tenantId, token, notificationApi);
      if (result !== null) {
        setPaymentModalOpen(false);
        const updatedSummary = await getRentSummary(Number(leaseId), token, notificationApi);
        setRentSummary(updatedSummary);
      }
    } finally {
      setPaymentSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "55vh", display: "grid", placeItems: "center" }}>
        {contextHolder}
        <Spin size="large" tip="Loading lease details..." />
      </div>
    );
  }

  if (!lease) {
    return (
      <div style={{ maxWidth: 960, margin: "24px auto" }}>
        {contextHolder}
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
          Back to leases
        </Button>
        <Card style={{ marginTop: 16 }}>
          <Empty description="This lease could not be found." />
        </Card>
      </div>
    );
  }

  const paymentBlocks = rentSummary?.paymentBlocks ?? [];
  const totalExpected = rentSummary?.totalExpectedAmount ?? 0;
  const totalPaid = rentSummary?.totalPaidAmount ?? 0;
  const totalOutstanding = rentSummary?.totalOutstandingAmount ?? 0;
  const progress = totalExpected > 0
    ? Math.min(Math.round((totalPaid / totalExpected) * 100), 100)
    : 0;
  const tenantName = [lease.tenant?.firstName, lease.tenant?.lastName].filter(Boolean).join(" ");

  const paymentColumns: TableProps<PaymentBlockSummaryDTO>["columns"] = [
    {
      title: "Period",
      key: "period",
      render: (_, block) => `${formatDate(block.startDate)} – ${formatDate(block.endDate)}`,
    },
    {
      title: "Due date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: formatDate,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => formatMoney(amount),
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      key: "paidAmount",
      render: (amount: number) => formatMoney(amount),
    },
    {
      title: "Outstanding",
      dataIndex: "outstandingAmount",
      key: "outstandingAmount",
      render: (amount: number) => formatMoney(amount),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: PaymentBlockStatus) => (
        <Tag color={status === PaymentBlockStatus.PAID ? "success" : "warning"}>{status.replaceAll("_", " ")}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, block) => (
        <Button
          type="primary"
          size="small"
          icon={<CreditCardOutlined />}
          disabled={block.status === PaymentBlockStatus.PAID || block.outstandingAmount <= 0}
          onClick={() => openPaymentModal(block.id, block.outstandingAmount)}
        >
          Record payment
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 0 40px" }}>
      {contextHolder}
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
        Back to leases
      </Button>

      <Card style={{ marginTop: 12, marginBottom: 16 }}>
        <Flex justify="space-between" align="center" gap={12} wrap>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Lease {lease.referenceNumber ? `#${lease.referenceNumber}` : `#${lease.id}`}
            </Title>
            <Tag color={lease.status === LeaseStatus.ACTIVE ? "success" : "default"} style={{ marginTop: 8 }}>
              {lease.status.replaceAll("_", " ")}
            </Tag>
          </div>
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Lease information" style={{ height: "100%" }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Tenant">{tenantName || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Phone number">{lease.tenant?.phoneNumber || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Email">{lease.tenant?.email || "Not available"}</Descriptions.Item>
              <Descriptions.Item label="Start date">{formatDate(lease.startDate)}</Descriptions.Item>
              <Descriptions.Item label="End date">{formatDate(lease.endDate)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Rent terms" style={{ height: "100%" }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Rent">{formatRent(lease)}</Descriptions.Item>
              <Descriptions.Item label="Payment requirement">
                {lease.fullLeasePaymentRequired ? "Full lease payment required" : "Installments allowed"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Rent summary">
            {rentSummary ? (
              <>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Text type="secondary">Total rent</Text>
                      <Title level={4} style={{ margin: "4px 0 0" }}>{formatMoney(totalExpected)}</Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Text type="secondary">Paid</Text>
                      <Title level={4} style={{ margin: "4px 0 0", color: "#389e0d" }}>{formatMoney(totalPaid)}</Title>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Text type="secondary">Outstanding</Text>
                      <Title level={4} style={{ margin: "4px 0 0", color: totalOutstanding > 0 ? "#cf1322" : "#389e0d" }}>
                        {formatMoney(totalOutstanding)}
                      </Title>
                    </Card>
                  </Col>
                </Row>
                <Progress percent={progress} style={{ marginTop: 12 }} />
                {paymentBlocks.length > 0 ? (
                  <div style={{ marginTop: 16, overflowX: "auto" }}>
                    <Table<PaymentBlockSummaryDTO>
                      columns={paymentColumns}
                      dataSource={paymentBlocks}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: 760 }}
                      size="small"
                    />
                  </div>
                ) : (
                  <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
                    No rent payment schedule is available for this lease.
                  </Text>
                )}
              </>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Rent summary is unavailable"
                description="The lease information is available, but its payment summary could not be loaded."
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Record payment"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={{ xs: "96%", sm: "90%", md: 560 }}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleRecordPayment}
          style={{ marginTop: 20 }}
        >
          <Form.Item name="paymentBlockId" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="payerUserId" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="currency" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber disabled controls={false} style={{ width: "100%" }} suffix={lease.rent?.currency || "TZS"} />
          </Form.Item>
          <Form.Item
            label="Payment method"
            name="method"
            rules={[{ required: true, message: "Choose a payment method." }]}
          >
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio.Button value={PaymentMethod.CASH}>Cash</Radio.Button>
              <Radio.Button value={PaymentMethod.BANK_TRANSFER}>Bank transfer</Radio.Button>
              <Radio.Button value={PaymentMethod.MOBILE_MONEY}>Mobile money</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="reference" label="Reference (optional)">
            <Input placeholder="Payment reference" />
          </Form.Item>
          <Form.Item name="note" label="Note (optional)">
            <Input.TextArea rows={3} placeholder="Add a note" />
          </Form.Item>
          <Flex justify="flex-end" gap={8}>
            <Button onClick={() => setPaymentModalOpen(false)} disabled={paymentSaving}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={paymentSaving} disabled={!selectedPayment}>
              Submit payment
            </Button>
          </Flex>
        </Form>
      </Modal>
    </div>
  );
}
