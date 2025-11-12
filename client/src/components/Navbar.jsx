import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Menu as MenuIcon } from "lucide-react";
import { ModeToggle } from "../components/mode-toggle";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const renderLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Button  onClick={() => handleNavigation("/login")}>
            Login
          </Button>
          <Button  onClick={() => handleNavigation("/register")}>
            Register
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="link" onClick={() => handleNavigation("/profile")}>
          Profile
        </Button>
        <Button variant="link" onClick={() => handleNavigation("/wallet")}>
          Wallet
        </Button>
        <Button variant="link" onClick={() => handleNavigation("/upi")}>
          UPI
        </Button>
        {user && ["merchant", "admin"].includes(user.role) && (
          <Button
            variant="link"
            onClick={() => handleNavigation("/merchant/dashboard")}
          >
            Dashboard
          </Button>
        )}
        {user && user.role === "admin" && (
          <Button
            variant="link"
            onClick={() => handleNavigation("/admin/users")}
          >
            Users
          </Button>
        )}
        <Button  onClick={handleLogout}>
          Logout
        </Button>
      </>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-between items-center w-full bg-background border-b p-2">
        <h1
          onClick={() => handleNavigation("/wallet")}
          className="ml-2 font-bold text-foreground cursor-pointer hover:text-primary"
        >
          Payment Gateway
        </h1>
        <div className="flex items-center gap-4">
          {!isAuthenticated && (
            <Button variant="link" onClick={() => handleNavigation("/")}>
              Home
            </Button>
          )}
          {/* <Button variant="link" onClick={() => handleNavigation("/")}>
            Home
          </Button> */}
          {renderLinks()}
          <ModeToggle />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-between items-center p-2 bg-background border-b">
        <h1
          onClick={() => handleNavigation("/wallet")}
          className="ml-2 font-bold text-foreground cursor-pointer hover:text-primary"
        >
          Payment Gateway
        </h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col items-start gap-2 mt-4">
                {!isAuthenticated && (
                  <Button variant="link" onClick={() => handleNavigation("/")}>
                    Home
                  </Button>
                )}
                {/* <Button variant="link" onClick={() => handleNavigation("/")}>
                  Home
                </Button> */}
                {renderLinks()}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

export default Navbar;
