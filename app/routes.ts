import Home from "./components/Home";
import HomePage from "./components/HomePage";
import InvitationDetails from "./components/InvitationDetails";
import LeaseDetails from "./components/LeaseDetails";

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
        path: "lease/:leaseId",
        Component: LeaseDetails,
      },
      {
        path: "invitation/:invitationToken",
        Component: InvitationDetails,
      }
    ],
  },
];

export default routes;
