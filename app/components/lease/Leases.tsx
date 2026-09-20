import { useEffect, useState } from "react";
import { Card, Listy, Spin, Avatar, Tag, Empty, Flex, Button, Row, Col } from "antd";
import { CreditCardOutlined, MoreOutlined, ProfileOutlined } from "@ant-design/icons";
import { LeaseDetailsDTO, LeaseStatus } from "../../models/lease";
import { leaseApi } from "../../api/api";
import { useNavigate } from "react-router";

const { Meta } = Card;

export default function Leases({ tenantId, jwtToken }: { tenantId: number; jwtToken: string | undefined }) {
    const navigate = useNavigate();
    const [leases, setLeases] = useState<LeaseDetailsDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const loadLeases = async () => {
        setLoading(true);
        try {
            const res = await leaseApi.getActiveLeasesByTenantId(tenantId, jwtToken ?? "");
            setLeases(res);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadLeases();
    }, [tenantId, jwtToken]);

    if (loading) {
        return (
            <div style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" tip="Loading leases..." />
            </div>
        );
    }

    return (
        <div>
            {leases.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#666" }}>
                    <Empty description="No active leases found."/>
                </div>
            ) : (
                <Listy<LeaseDetailsDTO>
                    items={leases}
                    rowKey="id"
                    itemRender={(item) => (
                        <Card>

                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={18} lg={18} xl={18}>
                                    <Meta
                                    avatar={
                                        <Avatar 
                                            size={52} 
                                            style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}>
                                            <ProfileOutlined style={{ fontSize: 28 }} />
                                        </Avatar>
                                    }
                                    title={
                                        item.status === LeaseStatus.ACTIVE ? (
                                            <Tag color="success">{item.status}</Tag>
                                        ) : (
                                            <Tag color="error">{item.status}</Tag>
                                        )
                                    }
                                    description={
                                        <div>
                                            <div>Start Date: {item.startDate}</div>
                                            <div>End Date: {item.endDate}</div>
                                        </div>
                                    }
                                />
                                </Col>
                                <Col xs={24} sm={4} lg={4} xl={4}>
                                    <Flex vertical gap="medium" >
                                        <Button onClick={() => navigate(`/leases/rent/${item.id}`)} variant="filled" color="primary">Rent Sumary <CreditCardOutlined /></Button>
                                        <Button variant="filled" color="orange">Lease Details <MoreOutlined /></Button>
                                    </Flex>
                                </Col>
                                
                            </Row>
                            
                        </Card>
                    )}
                />
            )}
        </div>
    );
}