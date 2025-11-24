import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const Profile = () => {
  const { user, updateProfile, updatePassword, loading, error } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setFormError("");
    setMessage("");
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setFormError("");
    setMessage("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      setMessage("Profile updated successfully");
    } catch (err) {
      setFormError(error || "Failed to update profile");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      setFormError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(passwordData.newPassword)) {
      setFormError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      setFormError("Password must contain at least one number");
      return;
    }

    if (
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)
    ) {
      setFormError("Password must contain at least one special character");
      return;
    }

    const commonPasswords = [
      "password",
      "password123",
      "12345678",
      "qwerty",
      "abc123",
    ];
    if (commonPasswords.includes(passwordData.newPassword.toLowerCase())) {
      setFormError("This password is too common. Please choose a stronger one");
      return;
    }
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setFormError(error || "Failed to update password");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="text-center space-y-4">
        <h1 className="mb-6 text-4xl font-bold text-foreground">
          User Profile
        </h1>

        {message && <div className="text-green-600 text-sm">{message}</div>}
        {(formError || error) && (
          <div className="text-red-600 text-sm">{formError || error}</div>
        )}

        <Tabs defaultValue="profile" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleProfileSubmit}>
              <Card>
                <CardContent className="space-y-2 pt-3">
                  <div className="space-y-1 text-left">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handlePasswordSubmit}>
              <Card>
                <CardContent className="space-y-2 pt-3">
                  <div className="space-y-1 text-left">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
