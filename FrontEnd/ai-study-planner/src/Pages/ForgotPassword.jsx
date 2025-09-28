import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { API_BASE_URL } from '../config/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setSuccess(true);
        setMessage(data.message || "Password reset instructions have been sent to your email.");
      } else {
        const errorMessage = data.error || data.message || "Failed to send reset email. Please try again.";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      
      // Check for actual network errors vs application errors
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
      } else if (error.name === "NetworkError" || error.message.includes("NetworkError")) {
        setError("Network error. Please check your internet connection and try again.");
      } else if (error.message.includes("Failed to fetch")) {
        setError("Cannot reach the server. Please ensure the server is running and try again.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Back to Login
            </button>
            
            <button
              onClick={() => {
                setSuccess(false);
                setEmail("");
                setError("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition duration-200"
            >
              Try Different Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
        <div className="flex items-center mb-6">
          <Link 
            to="/login" 
            className="text-gray-600 hover:text-gray-800 transition-colors mr-4"
          >
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 flex-1">Reset Password</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

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
          <div className="flex items-center bg-gray-100 p-3 rounded-lg mb-6">
            <FaEnvelope className="text-gray-500 mr-3" />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-base"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base py-3 px-4 rounded-md transition duration-200 mb-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </span>
            ) : (
              "Send Reset Instructions"
            )}
          </button>
        </form>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-blue-500 hover:underline font-medium">
              Back to Login
            </Link>
          </p>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> Check your spam folder if you don't receive the email within a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
