import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebaseConfig";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // -------------------------------------------------
  // 🔵 FIRST: Handle Google redirect login results
  // -------------------------------------------------
useEffect(() => {
  let isMounted = true;

  (async () => {
    try {
      const result = await getRedirectResult(auth);

      if (!isMounted) return;

      console.log("Redirect login result:", result);

      if (result?.user) {
        // Redirect success
        navigate("/parking");
      } else {
        // No redirect happened — user pressed Back or canceled
        setIsLoggingIn(false);
      }
    } catch (error) {
      console.error("Redirect login error:", error.message);
      setIsLoggingIn(false);
    }
  })();

  return () => {
    isMounted = false;
  };
}, [navigate]);


  // -------------------------------------------------
  // 🔵 SECOND: Auto-redirect if user is already logged in
  // -------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // small delay prevents iOS race condition
        setTimeout(() => navigate("/parking"), 50);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // -------------------------------------------------
  // 🔵 Reset "Signing in..." when user presses Back
  // -------------------------------------------------
  useEffect(() => {
    const handlePageShow = () => setIsLoggingIn(false);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // -------------------------------------------------
  // 🔵 Google Login
  // -------------------------------------------------
  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // redirect is required for iOS/Chrome mobile
        await signInWithRedirect(auth, googleProvider);
      } else {
        // popup works on desktop browsers
        await signInWithPopup(auth, googleProvider);
        navigate("/parking");
      }
    } catch (error) {
      console.error("Google login failed:", error);

      if (error.code === "auth/popup-blocked") {
        setErrorMsg("Popup was blocked. Try using a different browser.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("You closed the sign-in window.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setErrorMsg("Another sign-in attempt is already running.");
      } else {
        setErrorMsg("Google login failed. Please try again.");
      }
      setIsLoggingIn(false);
    }
  };

  // -------------------------------------------------
  // 🔵 Email Signup/Login
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
        setErrorMsg("Something went wrong. Please try again.");
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
      </div>
    </div>
  );
}

export default LoginPage;