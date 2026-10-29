import Home from "./components/Home";
import HomePage from "./components/HomePage";
import InvitationDetails from "./components/invitation/InvitationDetails";
import CreateLease from "./components/lease/CreateLease";
import LeaseDetails from "./components/lease/LeaseDetails";
import LeasesDashboard from "./components/lease/LeasesDashboard";
import LeasesPage from "./components/lease/LeasesPage";
import RentSummary from "./components/rent/RentSummary";

const routes = [
  {
    path: "/",
    Component: Home,
    children: [
      {
        path: "",
        Component: HomePage,
      },
      {
        path: "leases",
        Component: LeasesPage,
        children: [
          {
            path: "",
            Component: LeasesDashboard,
          },
          {
            path: ":leaseId",
            Component: LeaseDetails,
          },
          {
            path: "rent/:leaseId",
            Component: RentSummary,
          },
          {
            path: "create",
            Component: CreateLease,
          },
        ]
      },
      {
        path: "invitations/:invitationToken",
        Component: InvitationDetails,
      }
    ],
  },
];

export default routes;
