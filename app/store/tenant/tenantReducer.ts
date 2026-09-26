import { TenantAction, TenantState } from "../../models/user";

export const tenantReducer = (state: TenantState, action: TenantAction): TenantState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, tenantDetails: action.payload, loading: false, error: null };

    case "FETCH_ERROR":
      return { ...state, tenantDetails: null, loading: false, error: action.payload };

    case "LOGOUT":
      return { ...state, tenantDetails: null, loading: false, error: null };

    default:
      return state;
  }
};
