import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebaseConfig";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();

  // -------------------------------------------------
  // 🔵 Google redirect result
  // -------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const result = await getRedirectResult(auth);

        if (!isMounted) return;

        if (result?.user) {
          navigate("/parking");
        } else {
          setIsLoggingIn(false);
        }
      } catch (error) {
        console.error("Redirect login error:", error.message);
        setErrorMsg("Google login failed. Please try again.");
        setIsLoggingIn(false);
      }
    })();

    return () => (isMounted = false);
  }, [navigate]);

  // -------------------------------------------------
  // 🔵 Redirect if already logged in
  // -------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setTimeout(() => navigate("/parking"), 80);
      }
    });
    return () => unsub();
  }, [navigate]);

  // -------------------------------------------------
  // 🔵 Reset back button UI
  // -------------------------------------------------
  useEffect(() => {
    const resetOnBack = () => setIsLoggingIn(false);
    window.addEventListener("pageshow", resetOnBack);
    return () => window.removeEventListener("pageshow", resetOnBack);
  }, []);

  // -------------------------------------------------
  // 🔵 Google Login
  // -------------------------------------------------
  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/parking");
    } catch (error) {
      console.error("Google login error:", error);

      if (error.code === "auth/popup-blocked") {
        setErrorMsg("Popup blocked. Try another browser.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("You closed the sign-in window.");
      } else {
        setErrorMsg("Google login failed. Try again.");
      }

      setIsLoggingIn(false);
    }
  };

  // -------------------------------------------------
  // 🔵 Email Login / Signup
  // -------------------------------------------------
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      navigate("/parking");
    } catch (error) {
      console.error("Auth error:", error.message);

      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already in use.");
      } else if (error.code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password must be at least 6 characters.");
      } else {
        setErrorMsg("Something went wrong. Try again.");
      }
    }
  };

  // -------------------------------------------------
  // 🔵 Password Reset
  // -------------------------------------------------
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Reset link sent! Check your inbox and/or Junk.");
    } catch (error) {
      console.error("Reset error:", error.message);
      if (error.code === "auth/user-not-found") {
        setResetMessage("No account found with that email.");
      } else {
        setResetMessage("Error sending reset email.");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>

        <p className="login-subtitle">
          {isSignup
            ? "Sign up to start using Pin My Park"
            : "Sign in to continue to Pin My Park"}
        </p>

        {errorMsg && <p className="error-text">{errorMsg}</p>}

        <form className="login-form" onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* 🔵 Forgot password link */}
          {!isSignup && (
            <p
              className="forgot-password"
              onClick={() => {
                setResetModalOpen(true);
                setResetEmail(email);
                setResetMessage("");
              }}
            >
              Forgot password?
            </p>
          )}

          <button type="submit" className="primary-button">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          className="login-button"
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          <span>{isLoggingIn ? "Signing in..." : "Continue with Google"}</span>
        </button>

        <p className="toggle-text">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsSignup(!isSignup);
              setErrorMsg("");
            }}
          >
            {isSignup ? "Login" : "Sign up"}
          </button>
        </p>

        <button
          className="secondary-button"
          onClick={() => navigate("/parking")}
        >
          Continue without an account
        </button>
      </div>

      {/* 🔵 PASSWORD RESET MODAL */}
      {resetModalOpen && (
        <div className="reset-overlay">
          <div className="reset-modal">
            <h3>Reset Password</h3>

            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />

            {resetMessage && <p className="reset-message">{resetMessage}</p>}

            <div className="reset-buttons">
              <button className="primary-button" onClick={handlePasswordReset}>
                Send Reset Link
              </button>

              <button
                className="secondary-button"
                onClick={() => setResetModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;