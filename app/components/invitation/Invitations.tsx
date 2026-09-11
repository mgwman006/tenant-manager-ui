import { useEffect, useState } from "react";
import { List, Spin } from "antd";
import { tenantInvitationApi } from "../../api/api";
import { TenantInvitationDetailsDTO } from "../../models/user";

export default function Invitations({
  phoneNumber,
  jwtToken,
}: {
  phoneNumber: string;
  jwtToken: string | undefined;
}) {
  const [invitations, setInvitations] = useState<TenantInvitationDetailsDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvitations = async () => {
    if (!phoneNumber || !jwtToken) {
      setInvitations([]);
      return;
    }

    setLoading(true);
    try {
      const res = await tenantInvitationApi.getActiveInvitationsByPhoneNumber(phoneNumber, jwtToken);
      setInvitations(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to load invitations", error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvitations();
  }, [phoneNumber, jwtToken]);

  if (loading && invitations.length === 0) {
    return <Spin />;
  }

  return (
    <List
      loading={loading}
      dataSource={invitations}
      locale={{ emptyText: "No invitations found" }}
      renderItem={(item: TenantInvitationDetailsDTO) => (
        <List.Item>
          <div>
            <strong>{item.phoneNumber}</strong>
            <div>{item.status}</div>
          </div>
        </List.Item>
      )}
    />
  );
}
