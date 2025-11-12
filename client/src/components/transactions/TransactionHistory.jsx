import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const { isAuthenticated } = useAuth();

  // Fetch transactions
  const fetchTransactions = async (page = 1, filters = {}) => {
    try {
      setLoading(true);

      // Build query string
      let queryParams = `page=${page}&limit=${pagination.limit}`;

      if (filters.type) queryParams += `&type=${filters.type}`;
      if (filters.status) queryParams += `&status=${filters.status}`;
      if (filters.startDate) queryParams += `&startDate=${filters.startDate}`;
      if (filters.endDate) queryParams += `&endDate=${filters.endDate}`;

      const response = await axios.get(`/api/transactions?${queryParams}`);

      setTransactions(response.data.data);
      setPagination({
        ...pagination,
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      });

      setLoading(false);
    } catch (err) {
      setError("Failed to load transactions");
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions(pagination.page, filters);
    }
  }, [isAuthenticated]);

  // Refresh transactions when component becomes visible
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (isAuthenticated && document.visibilityState === "visible") {
        fetchTransactions(pagination.page, filters);
      }
    }, 30000); // Refresh every 30 seconds when visible

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, pagination.page, filters]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    fetchTransactions(1, filters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchTransactions(newPage, filters);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format amount
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // Get transaction type badge class
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "payment":
        return "badge-primary";
      case "transfer":
        return "badge-info";
      case "refund":
        return "badge-warning";
      case "deposit":
        return "badge-success";
      case "withdrawal":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  // Get transaction status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "pending":
        return "badge-warning";
      case "failed":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  if (loading && transactions.length === 0) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="transaction-history">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Transaction History
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-section bg-background">
        <form onSubmit={applyFilters}>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="type" className="text-foreground">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="text-foreground bg-background"
              >
                <option value="">All Types</option>
                <option value="payment">Payment</option>
                <option value="transfer">Transfer</option>
                <option value="refund">Refund</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="status" className="text-foreground">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              
            </div>
            

            <div className="filter-group">
              <label htmlFor="startDate" className="text-foreground">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="text-foreground"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="endDate" className="text-foreground">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="text-foreground"
              />
            </div>
            <Button type="submit">Apply Filters</Button>
            {/* <button type="submit" className="btn-primary bg-background text-foreground">Apply Filters</button> */}
          </div>
        </form>
      </div>

      {transactions.length > 0 ? (
        <div className="transaction-table-container">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{transaction.transactionId}</td>
                  <td>{formatDate(transaction.createdAt)}</td>
                  <td>
                    <span
                      className={`badge ${getTypeBadgeClass(transaction.type)}`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td>{formatAmount(transaction.amount)}</td>
                  <td>
                    <span
                      className={`badge ${getStatusBadgeClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() =>
                        (window.location.href = `/transactions/${transaction.transactionId}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn-page"
            >
              Previous
            </button>

            <span className="page-info">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn-page"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="no-transactions">
          <p>No transactions found.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
