import Home from "./components/Home";
import HomePage from "./components/HomePage";
import InvitationDetails from "./components/invitation/InvitationDetails";
import LeaseDetails from "./components/lease/LeaseDetails";

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
        path: "leases/:leaseId",
        Component: LeaseDetails,
      },
      {
        path: "invitations/:invitationToken",
        Component: InvitationDetails,
      }
    ],
  },
];

export default routes;
