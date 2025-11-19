import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../../client/src/components/theme-provider";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./components/user/Profile";
import Dashboard from "./components/merchant/Dashboard";
import UserManagement from "./components/admin/UserManagement";
import WalletDashboard from "./components/transactions/WalletDashboard";
import TransactionDetail from "./components/transactions/TransactionDetail";
import UpiDashboard from "./components/upi/UpiDashboard";
import UpiSetup from "./components/upi/UpiSetup";
import UpiPayment from "./components/upi/UpiPayment";
import SessionManager from "./components/common/SessionManager";
import PrivateRoute from "./components/routing/PrivateRoute";
import RoleRoute from "./components/routing/RoleRoute";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider >
        {/* value={{ user: { email: "yash966591@gmail.com" } }} */}
        <Navbar />
        <SessionManager />
        {/* <div > */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/wallet" element={<WalletDashboard />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/transactions/:id" element={<TransactionDetail />} />
              <Route path="/upi" element={<UpiDashboard />} />
              <Route path="/upi/setup" element={<UpiSetup />} />
              <Route path="/upi/payment" element={<UpiPayment />} />
            </Route>

            {/* Merchant Routes */}
            <Route element={<RoleRoute allowedRoles={["merchant", "admin"]} />}>
              <Route path="/merchant/dashboard" element={<Dashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>
          </Routes>
        {/* </div> */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
