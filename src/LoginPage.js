import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Import the new CSS file

function LoginPage() {
  const navigate = useNavigate();

  /*
  const handleLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/parking");
    } catch (error) {
      console.error("Login error:", error.message);
      alert("Login failed. Please try again.");
    }
  };
  */

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Sign in to continue to <span className="brand">Pin My Park</span>
        </p>

        <div className="login-buttons">
          {/* Google Login */}
          <button
            // onClick={() => handleLogin(googleProvider)}
            className="login-button"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
            />
            <span>Continue with Google</span>
          </button>

          {/* Microsoft Login */}
          <button
            // onClick={() => handleLogin(microsoftProvider)}
            className="login-button"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="Microsoft"
            />
            <span>Continue with Microsoft</span>
          </button>
        </div>

        <div className="login-footer">
          <p>
            By continuing, you agree to our{" "}
            <a href="/terms">Terms</a> and{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
