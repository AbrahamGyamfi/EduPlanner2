import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Logo from "../components/Logo";
import { API_BASE_URL } from '../config/api';

const Login = ({ onLogin }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page user was trying to access before login
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    console.log("Login attempt with:", { email, password: "***" });

    try {
      console.log("Sending request to backend...");
      // Try without credentials first since the server doesn't appear to support them
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        // Remove credentials: "include" as the server isn't configured for it
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If we can't parse JSON, it might be a server error
          throw new Error("Server error. Please try again later.");
        }
        
        console.error("Backend error:", errorData);
        
        // Display user-friendly error messages based on status code
        if (response.status === 401) {
          throw new Error(errorData.error || "The email or password you entered is incorrect. Please check your credentials and try again.");
        } else if (response.status === 403) {
          throw new Error(errorData.error || "Your account has been deactivated. Please contact support.");
        } else if (response.status === 400) {
          throw new Error(errorData.error || "Please check your input and try again.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(errorData.error || errorData.message || "Unable to login. Please try again.");
        }
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Check for success in the response
      if (data.status === "success") {
        console.log("Login successful, storing user data");
        localStorage.setItem("firstname", data.user.firstname);
        localStorage.setItem("lastname", data.user.lastname);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("userId", data.user.id || data.user._id);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin?.();
        // Navigate to the page user was trying to access, or dashboard by default
        navigate(from, { replace: true });
      } else {
        console.error("Login failed:", data.error);
        setError(data.error || "Login failed. Please check your email and password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Check for actual network errors vs application errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
      } else if (error.name === "NetworkError" || error.message.includes("NetworkError")) {
        setError("Network error. Please check your internet connection and try again.");
      } else if (error.message.includes("Failed to fetch")) {
        setError("Cannot reach the server. Please ensure the server is running and try again.");
      } else {
        // This handles our custom errors thrown above (401, 403, 400, etc.)
        setError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent p-5">
        <Logo variant="light" className="mb-2" />
        <p className="text-lg text-gray-600 mb-6">Your Smart Study Companion</p>
        <div className="w-40 h-40 rounded-full overflow-hidden shadow-md">
          <img
            src="https://thumbs.dreamstime.com/b/portrait-happy-female-african-american-college-student-237737919.jpg"
            alt="Student"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="bg-white p-5 rounded-lg shadow-md text-center w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2">Welcome! 👋</h2>
          <p className="text-gray-600 mb-4">Please sign in to access your study dashboard</p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg mb-4">
              <FaEnvelope className="text-gray-500 mr-3" />
              <input
                type="email"
                placeholder="What is your e-mail?"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-base"
              />
            </div>

            <div className="flex items-center bg-gray-100 p-3 rounded-lg mb-4">
              <FaLock className="text-gray-500 mr-3" />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 text-base"
              />
              <span
                className="text-gray-500 cursor-pointer"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="flex justify-between items-center mb-5 text-sm text-gray-600">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="mr-2"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-blue-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base py-2 px-4 rounded-md transition duration-200"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Continue"}
            </button>
          </form>

          <p className="mt-4 text-sm">
            New to EduPlanner? <Link to="/signup" className="text-green-600 font-bold hover:underline">Create your account</Link>
          </p>
          
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              🎓 <strong>Get Started:</strong> Sign up to access smart study tracking, automated quizzes, AI-powered summaries, and personalized learning analytics!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;