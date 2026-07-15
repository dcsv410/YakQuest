import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";
import "./leafletIconFix";

import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import RiversPage from "./pages/RiversPage";
import PlanTripPage from "./pages/PlanTripPage";
import SavedTripsPage from "./pages/SavedTripsPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboardPage from "./admin/pages/AdminDashboardPage";
import AdminRiversPage from "./admin/pages/AdminRiversPage";
import AdminContributionsPage from "./admin/pages/AdminContributionsPage";
import AdminUsersPage from "./admin/pages/AdminUsersPage";
import AdminAnalyticsPage from "./admin/pages/AdminAnalyticsPage";
import AdminRiverEditorPage from "./admin/pages/AdminRiverEditorPage";
import AdminRiverImportPage from "./admin/pages/AdminRiverImportPage";

import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rivers" element={<RiversPage />} />
            <Route path="/plan" element={<PlanTripPage />} />
            <Route path="/saved-trips" element={<SavedTripsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />}/>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="rivers" element={<AdminRiversPage />} />
              <Route path="rivers/:riverId/edit" element={<AdminRiverEditorPage />} />
              <Route path="contributions" element={<AdminContributionsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="rivers/import" element={<AdminRiverImportPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);