import { useEffect, useState } from "react";
import { leaseApi } from "../../api/api";
import { Card, Listy, Spin, Avatar } from "antd";
import { SettingOutlined, EditOutlined, EllipsisOutlined, DockerOutlined, UserAddOutlined, ProfileOutlined } from "@ant-design/icons";
import { LeaseDetailsDTO } from "../../models/lease";
const { Meta } = Card;

export default function Leases({ tenantId, jwtToken }: { tenantId: number; jwtToken: string | undefined }) {
    const [leases, setLeases] = useState<LeaseDetailsDTO[]>([]);

    const loadLeases = async () => {
        const res = await leaseApi.getActiveLeasesByTenantId(tenantId, jwtToken ?? "");
        setLeases(res);
    };

    useEffect(() => {
        void loadLeases();
    }, [tenantId, jwtToken]);

    if (leases.length <= 0) {
        return <Spin />;
    }

    return (
        <div>
            <Listy<LeaseDetailsDTO>
                items={leases}
                rowKey="id"
                itemRender={(item) => 
                    <Card >
                        <Meta
                            avatar={<ProfileOutlined />}
                            title={item.status}
                            description={`${item.startDate} -> ${item.endDate}`}
                       />
                   </Card> 
                }
            />
        </div>
    );
}