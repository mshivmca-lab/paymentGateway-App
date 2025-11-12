import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import PaymentForm from "../components/PaymentForm";
const Home = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-grow flex flex-col justify-center items-center gap-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Razorpay Payment Gateway
          </h1>
          <p className="text-lg text-muted-foreground">
            Secure, seamless, and swift payment solutions for your business
          </p>
        </div>
        <Button size="lg" onClick={() => handleNavigation("/login")}>
          Get Started
        </Button>
      </div>
      {/* <PaymentForm/> */}
      {/* Footer */}
      <footer className="mt-8 pt-4 border-t flex flex-col md:flex-row justify-between items-center gap-4  mb-3 p-2">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">
            About Us
          </a>
          <a href="#" className="hover:text-foreground">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms of Service
          </a>
          <a href="#" className="hover:text-foreground">
            Cookie Policy
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Payment Gateway © 2024 All Rights Reserved
        </p>
      </footer>
      
    </div>
  );
};

export default Home;
