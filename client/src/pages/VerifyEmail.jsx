// client/src/pages/VerifyEmail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api";

const VerifyEmail = () => {
  const { token } = useParams();
  const [serverResponse, setServerResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auth/verify-email/${token}`);
        setServerResponse(res.data || { success: true, message: "Email verified successfully" });
      } catch (error) {
        setServerResponse({ 
          success: false, 
          message: error.response?.data?.message || "Verification failed or token expired."
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className="p-4 text-center">
      {loading && (
        <div>
          <h2>🔄 Verifying your email...</h2>
        </div>
      )}
      
      {!loading && serverResponse && (
        <div>
          <h2>
            {serverResponse.success ? "✅" : "❌"} {serverResponse.message}
          </h2>
          {serverResponse.success && (
            <p className="mt-4">
              <a href="/login" className="text-blue-500 hover:underline">
                Click here to login
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;