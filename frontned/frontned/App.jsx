// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AnimatedPage from "./components/AnimatedPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ClientsPage from "./pages/ClientsPage";
import DriversPage from "./pages/DriversPage";
import GoodsPage from "./pages/GoodsPage";
import TripsPage from "./pages/TripsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ExpensesPage from "./pages/ExpensesPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDashboard from "./pages/InvoiceDashboard";
import VehiclesPage from "./pages/VehiclesPage";
import AddVehiclePage from "./pages/AddVehiclePage";
import TripsForm from "./pages/TripsForm";
import AdvancesPage from "./pages/AdvancesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminAnalytics from "./pages/AdminAnalytics";
import BillsPage from "./pages/BillsPage";
import LogoutHandler from "./pages/LogoutHandler";
import GenerateInvoice from "./pages/GenerateInvoice";
import DriverExpensesPage from "./pages/DriverExpensesPage";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import SmartPaymentsPage from "./pages/SmartPaymentsPage";
import InvoiceCreationPage from "./pages/InvoiceCreationPage";

// ==========================
// THEME CONFIGURATION
// ==========================
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#ff4081",
    },
    background: {
      default: "#f4f6f8",
    },
  },
  typography: {
    fontFamily: `'Poppins', 'Roboto', 'Arial', sans-serif`,
    fontWeightMedium: 500,
  },
});

// ==========================
// MAIN APP CONTENT  
// ==========================
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {!isLoginPage && <Topbar />}

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {!isLoginPage && <Sidebar />}

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: isLoginPage ? "0" : "40px 24px 100px 24px",
            WebkitOverflowScrolling: "touch",
          }}
          className="no-scrollbar"
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <Dashboard />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/clients/dashboard"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <ClientDashboard />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <ClientsPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/drivers"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <DriversPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goods"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <GoodsPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <TripsPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <PaymentsPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/smart-payments"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <SmartPaymentsPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <ExpensesPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <InvoiceDashboard />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/create"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <InvoiceCreationPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <VehiclesPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles/add"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <AddVehiclePage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advances"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <AdvancesPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips/add"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <TripsForm />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <ProfilePage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-analytics"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <AdminAnalytics />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bills"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <BillsPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logout"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <LogoutHandler />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generate-invoice"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <GenerateInvoice />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver-expenses"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <DriverExpensesPage />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard-analytics"
                element={
                  <ProtectedRoute>
                    <AnimatedPage>
                      <DashboardAnalytics />
                    </AnimatedPage>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

// ==========================
// APP WRAPPER
// ==========================
const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  </ThemeProvider>
);

export default App;
