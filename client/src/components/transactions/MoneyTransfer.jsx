import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
const MoneyTransfer = ({ onTransferSuccess }) => {
  const [formData, setFormData] = useState({
    receiverEmail: "",
    amount: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [balance, setBalance] = useState(0);

  const { isAuthenticated } = useAuth();

  // Fetch user balance
  const fetchBalance = async () => {
    try {
      const response = await axios.get("/api/transactions/balance");
      setBalance(response.data.data.balance);
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.receiverEmail || !formData.amount) {
      setError("Please provide receiver email and amount");
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    // Check if user has sufficient balance
    if (amount > balance) {
      setError("Insufficient balance");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post("/api/transactions/transfer", formData);

      setSuccess("Money transferred successfully!");
      setFormData({
        receiverEmail: "",
        amount: "",
        description: "",
      });

      // Update balance
      fetchBalance();

      // Call the onTransferSuccess callback if provided
      if (onTransferSuccess) {
        onTransferSuccess();
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Transfer failed");
    }
  };

  return (
    <div className="money-transfer">
      <h2 className="mb-2 text-xl font-bold">Transfer Money</h2>

      <div className="balance-display">
        <h3 className="text-foreground bg-background">Your Balance</h3>
        <p className="balance-amount text-foreground bg-background">₹{balance.toFixed(2)}</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-group">
          <label htmlFor="receiverEmail">Receiver's Email</label>
          <input
            className="w-full rounded-md p-2 text-foreground bg-background"
            type="email"
            id="receiverEmail"
            name="receiverEmail"
            value={formData.receiverEmail}
            onChange={handleChange}
            placeholder="Enter receiver's email"
            required
          />  
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            className="w-full rounded-md p-2 text-foreground bg-background"
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            className="w-full rounded-md p-2 text-foreground bg-background border border-gray-300"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter a description for this transfer"
            rows="3"
          />
        </div>

        <Button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Processing..." : "Transfer Money"}
        </Button>
      </form>
    </div>
  );
};

export default MoneyTransfer;
