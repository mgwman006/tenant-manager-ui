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

  const loadInvitations = async () => {
    if (!phoneNumber || !jwtToken) {
      setInvitations([]);
      return;
    }

    const res = await tenantInvitationApi.getActiveInvitationsByPhoneNumber(phoneNumber, jwtToken);
    alert
    setInvitations(Array.isArray(res) ? res : []);
  };

  useEffect(() => {
    void loadInvitations();
  }, []);

  if (!invitations) {
    return <Spin />;
  }

  return (
    <List
      dataSource={invitations}
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
