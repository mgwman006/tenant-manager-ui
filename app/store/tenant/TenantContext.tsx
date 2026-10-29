import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { TenantState } from "../../models/user";
import {TENANT_STORAGE_KEY } from "../../utilities/constant";
import { tenantReducer } from "./tenantReducer";

type TenantntContextType = {
  tenantState: TenantState;
  dispatchTenantState: React.Dispatch<any>;
};

const TenantContext = createContext<TenantntContextType | undefined>(undefined);

const loadInitialState = (): TenantState => {
  try {
    const stored = localStorage.getItem(TENANT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        tenantDetails: parsed.tenantDetails ?? null,
        loading: false,
        error: parsed.error ?? null,
      };
    }
  } catch (error) {
    console.error("Failed to load state", error);
  }

  return {
    tenantDetails: null,
    loading: false,
    error: null,
  };
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      if (state.tenantDetails) {
        localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(TENANT_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [state.tenantDetails, state.loading, state.error]);

  const value = useMemo(() => ({ tenantState: state, dispatchTenantState: dispatch }), [state, dispatch]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};
