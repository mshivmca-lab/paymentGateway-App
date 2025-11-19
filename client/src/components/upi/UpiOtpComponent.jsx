import { useState, useEffect, useContext } from "react";
import api from "../../utils/api";
import AuthContext from "../../context/AuthContext";

const UpiOtpComponent = ({ onVerified }) => {
  const { user } = useContext(AuthContext);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins

  const sendOtp = async () => {
    try {
      await api.post("/otp/send-otp", { email: user.email });
      setOtpSent(true);
      setCooldown(60);
      setTimeLeft(300);
    } catch (err) {
      alert("Failed to send OTP");
    }
  };

  const verifyOtpAndPay = async () => {
    try {
      const res = await api.post("/otp/verify-otp", {
        email: user.email,
        otp,
      });
      alert("OTP Verified. You may now proceed to pay.");
      onVerified(); 
    } catch (err) {
      alert("Invalid or expired OTP");
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, timeLeft]);

  return (
    <div className="p-4">
      {!otpSent ? (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={sendOtp}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Send OTP"}
        </button>
      ) : (
        <>
          <p className="mb-2 text-sm text-gray-700">
            OTP sent to <strong>{user.email}</strong> — expires in {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
          </p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="border px-2 py-1 mb-2"
          />
          <br />
          <button className="bg-green-600 text-white px-4 py-2" onClick={verifyOtpAndPay}>
            Verify & Pay
          </button>
        </>
      )}
    </div>
  );
};

export default UpiOtpComponent;
