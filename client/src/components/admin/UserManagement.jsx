import { useState, useEffect } from "react";
import api from '../../utils/api';
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label"
import { Input } from "../ui/input"

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    phone: "",
  });
  const [formMode, setFormMode] = useState("create"); // 'create' or 'edit'
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load users");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  // Set form to create mode
  const handleCreateMode = () => {
    setFormMode("create");
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      role: "user",
      phone: "",
    });
    setFormError("");
    setMessage("");
  };

  // Set form to edit mode with selected user data
  const handleEditMode = (user) => {
    setFormMode("edit");
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
    });
    setFormError("");
    setMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formMode === "create") {
        // Create new user
        await api.post("/users", formData);
        setMessage("User created successfully");
      } else {
        // Update existing user
        await api.put(`/users/${selectedUser._id}`, formData);
        setMessage("User updated successfully");
      }

      // Reset form and fetch updated user list
      handleCreateMode();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || "Operation failed");
    }
  };

  // Handle user deletion
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setMessage("User deleted successfully");
      fetchUsers();
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  if (loading && users.length === 0) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="admin-user-management">
      <h2 className="text-2xl text-foreground font-bold text-center">
        User Management
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="user-management-container mt-8">
        <div className="user-list">
          <h3 className="text-xl text-foreground font-semibold mb-6">
            Users List
          </h3>
          {/* <Button className="btn-primary" onClick={handleCreateMode}>
            Add New User
          </Button> */}

          {users.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEditMode(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No users found</p>
          )}
        </div>

        <div className="user-form">
          <h3 className="text-xl text-foreground font-semibold mb-4">
            {formMode === "create" ? "Add New User" : "Edit User"}
          </h3>

          {formError && <div className="alert alert-danger">{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {formMode === "create" && (
              <div className="form-group">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  required={formMode === "create"}
                />
              </div>
            )}

            <div className="form-group">
              {/* <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">User</option>
                <option value="merchant">Merchant</option>
                <option value="admin">Admin</option>
              </select> */}
              <Label htmlFor="role">Register as</Label>
              <Select value={formData.role} onChange={handleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Role</SelectLabel>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-buttons">
              <Button type="submit" className="btn-primary">
                {formMode === "create" ? "Create User" : "Update User"}
              </Button>

              {formMode === "edit" && (
                <Button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCreateMode}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
