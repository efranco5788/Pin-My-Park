import React from "react";
// import { auth, googleProvider, microsoftProvider } from "./firebaseConfig";
// import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login to <span className="text-blue-600">Pin My Park</span>
        </h1>

        <div className="space-y-4">
          <button
            // onClick={() => handleLogin(googleProvider)}
            className="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-xl px-4 py-3 bg-white hover:bg-gray-100 transition duration-150 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-gray-700 font-medium">Sign in with Google</span>
          </button>

          <button
            // onClick={() => handleLogin(microsoftProvider)}
            className="w-full flex items-center justify-center space-x-3 border border-gray-300 rounded-xl px-4 py-3 bg-white hover:bg-gray-100 transition duration-150 shadow-sm"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="w-5 h-5" />
            <span className="text-gray-700 font-medium">Sign in with Microsoft</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
