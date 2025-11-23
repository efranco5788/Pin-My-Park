import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebaseConfig";
import {
  signInWithPopup,
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

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const [emailValid, setEmailValid] = useState(true);

  const navigate = useNavigate();

  // -------------------------------------------------
  // 🔵 Handle Google Redirect Result
  // -------------------------------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!mounted) return;

        if (result?.user) navigate("/parking");
        else setIsLoggingIn(false);
      } catch (e) {
        setErrorMsg("Google login failed. Try again.");
        setIsLoggingIn(false);
      }
    })();

    return () => (mounted = false);
  }, [navigate]);

  // -------------------------------------------------
  // 🔵 Auto-redirect if already logged in
  // -------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setTimeout(() => navigate("/parking"), 100);
    });
    return () => unsub();
  }, [navigate]);

  // -------------------------------------------------
  // 🔵 Reset "Signing in..." on back navigation
  // -------------------------------------------------
  useEffect(() => {
    const handler = () => setIsLoggingIn(false);
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  // -------------------------------------------------
  // 🔵 Real-time email validation
  // -------------------------------------------------
  useEffect(() => {
    if (email.length === 0) setEmailValid(true);
    else setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [email]);

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
      if (error.code === "auth/popup-blocked") {
        setErrorMsg("Popup blocked. Try another browser.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("Popup closed before completing sign in.");
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

    if (!emailValid) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      if (isSignup)
        await createUserWithEmailAndPassword(auth, email, password);
      else
        await signInWithEmailAndPassword(auth, email, password);

      navigate("/parking");
    } catch (error) {
      if (error.code === "auth/email-already-in-use")
        setErrorMsg("Email already registered.");
      else if (error.code === "auth/invalid-credential")
        setErrorMsg("Invalid email or password.");
      else if (error.code === "auth/weak-password")
        setErrorMsg("Password must be at least 6 characters.");
      else setErrorMsg("Something went wrong. Try again.");
    }
  };

  // -------------------------------------------------
  // 🔵 Forgot password
  // -------------------------------------------------
  const handleForgotPassword = async () => {
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Enter your email above first.");
      return;
    }
    if (!emailValid) {
      setErrorMsg("Enter a valid email before resetting.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setErrorMsg(
        "If an account exists for this email, a reset link has been sent."
      );
    } catch (error) {
      if (error.code === "auth/too-many-requests")
        setErrorMsg("Too many attempts. Please wait before trying again.");
      else setErrorMsg("Could not send reset link. Try again later.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Title */}
        <h1 className="login-title">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>

        <p className="login-subtitle">
          {isSignup
            ? "Sign up to start using Pin My Park"
            : "Sign in to continue"}
        </p>

        {errorMsg && <p className="error-text">{errorMsg}</p>}

        {/* FORM */}
        <form className="login-form" onSubmit={handleEmailAuth}>
          
          {/* Email input */}
          <input
            type="email"
            placeholder="Email address"
            className={!emailValid ? "invalid-input" : ""}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!emailValid && (
            <p className="validation-text">Please enter a valid email.</p>
          )}

          {/* Password input + eye toggle */}
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="eye-button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Forgot password */}
          {!isSignup && (
            <button
              type="button"
              className="forgot-button"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          )}

          <button type="submit" className="primary-button">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">or</div>

        {/* Google login */}
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

        {/* Toggle login/signup */}
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

        {/* Continue without account */}
        <button
          className="secondary-button"
          onClick={() => navigate("/parking")}
        >
          Continue without an account
        </button>
      </div>
    </div>
  );
}

export default LoginPage;