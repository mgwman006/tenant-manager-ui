import { useEffect, useState } from "react";
import { Card, Listy, Spin, Avatar, Tag } from "antd";
import { ProfileOutlined } from "@ant-design/icons";
import { LeaseDetailsDTO } from "../../models/lease";
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
            <Listy<LeaseDetailsDTO>
                items={leases}
                rowKey="id"
                itemRender={(item) => (
                    <Card
                        onClick={() => navigate(`/leases/${item.id}`)}
                        style={{ cursor: "pointer" }}
                    >
                        <Meta
                            avatar={
                                <Avatar 
                                    size={52} 
                                    style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}>
                                    <ProfileOutlined style={{ fontSize: 28 }} />
                                </Avatar>
                            }
                            title={
                                item.amountPaid === item.paymentAmount ? (
                                    <Tag color="success">Paid</Tag>
                                ) : (
                                    <Tag color="error">Unpaid</Tag>
                                )
                            }
                            description={
                                <div>
                                    <div>Start Date: {item.startDate}</div>
                                    <div>End Date: {item.endDate}</div>
                                </div>
                            }
                        />
                    </Card>
                )}
            />
        </div>
    );
}