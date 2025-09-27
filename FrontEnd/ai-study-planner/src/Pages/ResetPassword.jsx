import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (!token || !email) {
      setTokenValid(false);
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/verify-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, email }),
        });

        const data = await response.json();
        if (response.ok && data.status === "success") {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.error || "Your password reset link has expired or is invalid. Please request a new one.");
        }
      } catch (error) {
        setTokenValid(false);
        // Check for actual network errors vs application errors
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          setError("Unable to connect to the server. Please check your internet connection and try again.");
        } else if (error.name === "NetworkError" || error.message.includes("NetworkError")) {
          setError("Network error. Please check your internet connection and try again.");
        } else if (error.message.includes("Failed to fetch")) {
          setError("Cannot reach the server. Please ensure the server is running and try again.");
        } else {
          setError("Unable to verify your reset link. Please try requesting a new password reset.");
        }
      }
    };

    verifyToken();
  }, [token, email]);

  useEffect(() => {
    // Update password strength indicators
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  }, [password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("The passwords you entered don't match. Please make sure both fields are identical.");
      return;
    }

    // Validate password strength
    const allCriteriaMet = Object.values(passwordStrength).every(Boolean);
    if (!allCriteriaMet) {
      setError("Your password doesn't meet all the security requirements. Please check the requirements below.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          token,
          email,
          new_password: password
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setSuccess(true);
      } else {
        const errorMessage = data.error || data.message || "Unable to reset your password. Please try again.";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      
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

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
            >
              Request New Reset Link
            </Link>
            
            <Link
              to="/login"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition duration-200"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Password Reset Successfully</h2>
          <p className="text-gray-600 mb-6">
            Your password has been updated. You can now log in with your new password.
          </p>
          
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Set New Password</h2>
        <p className="text-gray-600 mb-6">
          Enter your new password below
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
          {/* New Password */}
          <div className="flex items-center bg-gray-100 p-3 rounded-lg mb-4">
            <FaLock className="text-gray-500 mr-3" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-base"
            />
            <span
              className="text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="flex items-center bg-gray-100 p-3 rounded-lg mb-4">
            <FaLock className="text-gray-500 mr-3" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-base"
            />
            <span
              className="text-gray-500 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Password Strength Indicators */}
          {password && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              <div className="space-y-1">
                <div className={`flex items-center text-xs ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordStrength.length ? '✓' : '○'}</span>
                  At least 8 characters
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordStrength.uppercase ? '✓' : '○'}</span>
                  One uppercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordStrength.lowercase ? '✓' : '○'}</span>
                  One lowercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordStrength.number ? '✓' : '○'}</span>
                  One number
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.special ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordStrength.special ? '✓' : '○'}</span>
                  One special character
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base py-3 px-4 rounded-md transition duration-200 mb-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating Password...
              </span>
            ) : (
              "Update Password"
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
      </div>
    </div>
  );
};

export default ResetPassword;
