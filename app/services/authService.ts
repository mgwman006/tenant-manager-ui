import { NotificationInstance } from "antd/es/notification/interface";
const authUrl = import.meta.env.VITE_AUTH_URL?.trim();
const tenantManagerUrl = import.meta.env.VITE_TENANT_MANAGER_URL?.trim();

export function isTokenExpired(token?: string): boolean 
    {
        if (!token) 
        {
            return true;
        }

        try {
            const parts = token.split(".");
            if (parts.length < 2) {return true;}

            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            const exp = payload?.exp;

            if (typeof exp !== "number") {
                return true;
            }

            return Date.now() >= exp * 1000;
        } catch (error) {
            return true;
        }
    }



export const navigateToAuth = (
  nextApp: string = "tenant-manager",
  phone?: string,
  returnPath?: string,
): boolean => {
  if (!authUrl) {
    console.error("VITE_AUTH_URL is not configured.");
    return false;
  }

  const outGoingUrlValue = nextApp === "tenant-manager" && tenantManagerUrl
    ? `${tenantManagerUrl.replace(/\/$/, "")}${returnPath ?? ""}`
    : null;
  if (!outGoingUrlValue) {
    console.error("Unable to resolve outgoing URL for auth redirect.");
    return false;
  }

  const url = `${authUrl}?outGoingUrl=${encodeURIComponent(outGoingUrlValue)}&phoneNumber=${encodeURIComponent(phone ?? "")}`;
  window.location.href = url;
  return true;
};