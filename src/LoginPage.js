// --- your imports remain unchanged ---
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
  // 🔵 1️⃣ Handle Google Redirect Result
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
  // 🔵 2️⃣ Auto-redirect if already logged in
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
  // 🔵 3️⃣ Reset "Signing in..." on Back navigation
  // -------------------------------------------------
  useEffect(() => {
    const resetOnBack = () => setIsLoggingIn(false);
    window.addEventListener("pageshow", resetOnBack);
    return () => window.removeEventListener("pageshow", resetOnBack);
  }, []);

  // -------------------------------------------------
  // 🔵 4️⃣ Google Login Handler
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
  // 🔵 5️⃣ Email Login / Signup Handler
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

        {/* 🟦 NEW BUTTON ADDED HERE */}
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