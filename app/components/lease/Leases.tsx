import { useEffect, useState } from "react";
import { Button, Card, Col, Empty, Flex, List, notification, Row, Spin, Tag, Typography } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { LeaseDetailsDTO, LeaseStatus } from "../../models/lease";
import { getLeasesByTenantAndStatus } from "../../services/leaseService";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

const formatDate = (date: string) => {
    const parsedDate = new Date(`${date.slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsedDate.getTime())
        ? date
        : new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(parsedDate);
};

const formatRent = (lease: LeaseDetailsDTO) => {
    const rent = lease.rent;
    if (!rent || typeof rent.amount !== "number") {
        return "Rent details unavailable";
    }

    const currency = rent.currency || "TZS";
    const frequency = rent.frequency
        ? ` / ${rent.frequency.replaceAll("_", " ").toLowerCase()}`
        : "";
    return `${currency} ${new Intl.NumberFormat("en-TZ").format(rent.amount)}${frequency}`;
};

export default function Leases({ tenantId, jwtToken, status }: { tenantId: number; jwtToken: string | undefined; status: LeaseStatus }) {
    const navigate = useNavigate();
    const [notificationApi, contextHolder] = notification.useNotification();
    const [leases, setLeases] = useState<LeaseDetailsDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLeases = async () => {
        if (!tenantId || !jwtToken) {
            setLeases([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await getLeasesByTenantAndStatus(tenantId, status, jwtToken, notificationApi);
            setLeases(res);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadLeases();
    }, [tenantId, jwtToken, status]);

    if (loading) {
        return (
            <div style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {contextHolder}
                <Spin size="large" tip="Loading leases..." />
            </div>
        );
    }

    return (
        <div>
            {contextHolder}
            {leases.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#666" }}>
                    <Empty description="No leases found."/>
                </div>
            ) : (
                <List
                    dataSource={leases}
                    rowKey="id"
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
                    renderItem={(item) => (
                        <List.Item style={{ height: "100%" }}>
                            <Card
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 12,
                                    borderColor: "#e6ebf2",
                                }}
                                styles={{ body: { padding: 18 } }}
                            >
                                <Flex justify="space-between" align="center" gap={12} wrap>
                                    <Title level={5} style={{ margin: 0, overflowWrap: "anywhere" }}>
                                        Lease {item.referenceNumber ? `#${item.referenceNumber}` : `#${item.id}`}
                                    </Title>
                                    <Tag color={item.status === LeaseStatus.ACTIVE ? "success" : "default"}>
                                        {item.status.replaceAll("_", " ")}
                                    </Tag>
                                </Flex>

                                <Row gutter={[16, 12]} style={{ marginTop: 18 }}>
                                    <Col xs={24} sm={12} md={8}>
                                        <Text type="secondary">Start date</Text>
                                        <Text strong style={{ display: "block", marginTop: 4 }}>
                                            {formatDate(item.startDate)}
                                        </Text>
                                    </Col>
                                    <Col xs={24} sm={12} md={8}>
                                        <Text type="secondary">End date</Text>
                                        <Text strong style={{ display: "block", marginTop: 4 }}>
                                            {formatDate(item.endDate)}
                                        </Text>
                                    </Col>
                                    <Col xs={24} sm={12} md={8}>
                                        <Text type="secondary">Rent</Text>
                                        <Text strong style={{ display: "block", marginTop: 4, overflowWrap: "anywhere" }}>
                                            {formatRent(item)}
                                        </Text>
                                    </Col>
                                </Row>

                                <Button
                                    icon={<FileTextOutlined />}
                                    onClick={() => navigate(`/leases/${item.id}`)}
                                    style={{ marginTop: 18 }}
                                >
                                    Lease details
                                </Button>
                            </Card>
                        </List.Item>
                    )}
                />
            )}
        </div>
    );
}