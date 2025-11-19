import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Login from "../components/auth/Login";

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const PaymentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, refreshToken } = useAuth();
  const [formData, setFormData] = useState({
    amount: "",
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const isAddMoneyPage = location.pathname === "/payment";

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prevData) => ({
        ...prevData,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Your session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const amountInRupees = parseFloat(formData.amount);
      const amountInPaise = Math.round(amountInRupees * 100);

      if (isNaN(amountInPaise) || amountInPaise < 100) {
        alert("Please enter a valid amount (minimum ₹1)");
        setLoading(false);
        return;
      }

      const confirmPayment = window.confirm(
        `Confirm payment of ₹${amountInRupees}?`
      );
      if (!confirmPayment) {
        setLoading(false);
        return;
      }

      const response = await api.post("/payment/create-order", {
        amount: amountInPaise,
        currency: "INR",
        receipt: "order_" + Date.now(),
        notes: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      });

      const { order } = response.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Payment Gateway Demo",
        description: "Test Transaction",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              navigate("/payment/success", {
                state: {
                  paymentId: response.razorpay_payment_id,
                  amount: formData.amount,
                  from: isAddMoneyPage ? "wallet" : "home",
                },
              });
            } else {
              navigate("/payment/failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            navigate("/payment/failed");
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        };
        script.onerror = () => {
          alert("Payment gateway not loaded. Please refresh the page.");
        };
        document.head.appendChild(script);
        return;
      }

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        alert(`Payment failed: ${response.error.description}`);
        navigate("/payment/failed");
      });

      razorpay.open();
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const refreshed = await refreshToken();
          if (refreshed) {
            alert("Session refreshed. Try again.");
          } else {
            alert("Session expired. Please log in.");
          }
        } catch {
          alert("Session expired. Please log in.");
        }
      } else {
        const msg =
          error.response?.data?.details ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create payment order";

        alert(`Payment Error: ${msg}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-4">
            Please log in to make a payment
          </h2>
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center space-y-4 mb-6">
        <h1 className="text-4xl font-bold text-foreground">
          Razorpay Payment Gateway
        </h1>
      </div>

      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg">
        <CardHeader>
          <CardTitle className="text-3xl">
            {isAddMoneyPage ? "Add Money to Wallet" : "Make a Payment"}
          </CardTitle>
          <CardDescription>Enter Payment Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount in rupees"
                required
                min="1"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <Button type="submit" className="w-full h-10 sm:h-11" disabled={loading}>
              {loading ? "Processing..." : isAddMoneyPage ? "Add Money" : "Pay Now"}
            </Button>

            {isAddMoneyPage && (
              <Link
                to="/wallet"
                className="text-sm underline text-center block mt-2 text-blue-600"
              >
                Back to Wallet
              </Link>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;
