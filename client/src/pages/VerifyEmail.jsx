// client/src/pages/VerifyEmail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const [serverResponse, setServerResponse] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`)
      .then((res) =>
        setServerResponse(res.data || "Email verified successfully")
      )
      .catch(() => setServerResponse("Verification failed or token expired."));
  }, [token]);

  return (
    <div className="p-4 text-center">
      {serverResponse && (
        <div>
          <h2>
            {serverResponse.success ? "✅" : "❌"} {serverResponse.message}
          </h2>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
