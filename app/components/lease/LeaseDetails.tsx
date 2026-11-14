import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  notification,
  Row,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { LeaseDetailsDTO, LeaseStatus } from "../../models/lease";
import { getLease } from "../../services/leaseService";
import { navigateToAuth } from "../../services/authService";
import { useAccount } from "../../store/account/AccountContext";

const { Text, Title } = Typography;

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat("en-TZ", { dateStyle: "long" }).format(parsedDate);
};

const formatRent = (lease: LeaseDetailsDTO) => {
  const rent = lease.rent;
  if (!rent || typeof rent.amount !== "number") {
    return "Rent details unavailable";
  }

  const amount = `${rent.currency || "TZS"} ${new Intl.NumberFormat("en-TZ").format(rent.amount)}`;
  const frequency = rent.frequency
    ? ` per ${rent.frequency.replaceAll("_", " ").toLowerCase()}`
    : "";
  return `${amount}${frequency}`;
};

export default function LeaseDetails() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const { accountState } = useAccount();
  const [notificationApi, contextHolder] = notification.useNotification();
  const [lease, setLease] = useState<LeaseDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadLease = async () => {
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
      const details = await getLease(Number(leaseId), token, notificationApi);
      if (active) {
        setLease(details);
        setLoading(false);
      }
    };

    void loadLease();
    return () => {
      active = false;
    };
  }, [leaseId, accountState.accountDetails?.token]);

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
      <div style={{ maxWidth: 900, margin: "24px auto" }}>
        {contextHolder}
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
          Back to leases
        </Button>
        <Card style={{ marginTop: 16, borderRadius: 16 }}>
          <Empty description="This lease could not be found." />
        </Card>
      </div>
    );
  }

  const tenantName = [lease.tenant?.firstName, lease.tenant?.lastName].filter(Boolean).join(" ");

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 0 40px" }}>
      {contextHolder}
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
        Back to leases
      </Button>

      <Card
        variant="borderless"
        style={{
          margin: "12px 0 20px",
          borderRadius: 20,
          color: "#fff",
          background: "linear-gradient(120deg, #102a43 0%, #176b87 100%)",
        }}
        styles={{ body: { padding: "clamp(20px, 4vw, 36px)" } }}
      >
        <Row gutter={[20, 20]} align="middle" justify="space-between">
          <Col xs={24} md={15}>
            <Tag color={lease.status === LeaseStatus.ACTIVE ? "success" : "default"}>
              {lease.status.replaceAll("_", " ")}
            </Tag>
            <Title level={2} style={{ color: "#fff", margin: "12px 0 4px", overflowWrap: "anywhere" }}>
              Lease {lease.referenceNumber ? `#${lease.referenceNumber}` : `#${lease.id}`}
            </Title>
            <Text style={{ color: "rgba(255,255,255,.78)" }}>
              Your lease dates, payment terms, and tenant information.
            </Text>
          </Col>
          <Col xs={24} md={9}>
            <Button
              type="primary"
              size="large"
              icon={<CreditCardOutlined />}
              block
              onClick={() => navigate(`/leases/rent/${lease.id}`)}
            >
              View rent &amp; payments
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={<span><CalendarOutlined style={{ marginRight: 8 }} />Lease period</span>}
            style={{ height: "100%", borderRadius: 16 }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <div style={{ padding: 16, background: "#f5f8fc", borderRadius: 12, height: "100%" }}>
                  <Text type="secondary">Start date</Text>
                  <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600 }}>{formatDate(lease.startDate)}</div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ padding: 16, background: "#f5f8fc", borderRadius: 12, height: "100%" }}>
                  <Text type="secondary">End date</Text>
                  <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600 }}>{formatDate(lease.endDate)}</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={<span><DollarOutlined style={{ marginRight: 8 }} />Rent &amp; payment terms</span>}
            style={{ height: "100%", borderRadius: 16 }}
          >
            <div style={{ padding: 16, background: "#f5f8fc", borderRadius: 12 }}>
              <Text type="secondary">Rent amount</Text>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>
                {formatRent(lease)}
              </div>
            </div>
            <Alert
              showIcon
              type={lease.fullLeasePaymentRequired ? "warning" : "success"}
              message={lease.fullLeasePaymentRequired ? "Full lease payment required" : "Installment payments allowed"}
              style={{ marginTop: 12, borderRadius: 12 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<span><UserOutlined style={{ marginRight: 8 }} />Tenant</span>} style={{ height: "100%", borderRadius: 16 }}>
            {tenantName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }} />
                <div>
                  <Text strong style={{ display: "block" }}>{tenantName}</Text>
                  {lease.tenant?.phoneNumber && <Text type="secondary">{lease.tenant.phoneNumber}</Text>}
                  {lease.tenant?.email && <Text type="secondary" style={{ display: "block" }}>{lease.tenant.email}</Text>}
                </div>
              </div>
            ) : (
              <Text type="secondary">Tenant details are not available.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={<span><FileTextOutlined style={{ marginRight: 8 }} />Lease record</span>} style={{ height: "100%", borderRadius: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Reference">
                {lease.referenceNumber || `Lease ${lease.id}`}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={lease.status === LeaseStatus.ACTIVE ? "success" : "default"}>{lease.status.replaceAll("_", " ")}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
