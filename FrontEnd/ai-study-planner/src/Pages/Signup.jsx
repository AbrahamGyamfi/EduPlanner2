import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import OTPVerification from "../components/OTPVerification";
import "./Signup.css";
// import {
//   FaEnvelope,
//   FaEye,
//   FaEyeSlash,
//   FaUser,
//   FaIdCard,
//   FaLock,
// } from "react-icons/fa";

const Signup = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
    
    // Update password strength indicators
    if (name === 'password') {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    // Client-side validation
    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Use the separate first and last name fields
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      
      // Generate a student ID if not provided
      const studentId = `STU${Date.now().toString().slice(-6)}`;

      const signupData = {
        firstname: firstName,
        lastname: lastName,
        studentId: studentId,
        email: form.email.trim(),
        password: form.password
      };

      console.log('Sending signup request:', { ...signupData, password: '***' });

      const response = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (response.ok && data.status === "success") {
        if (data.requires_otp) {
          // Show OTP verification screen
          setRegistrationEmail(data.email);
          setShowOTPVerification(true);
          
          // Show dev OTP in console if available (development mode)
          if (data.dev_otp) {
            console.log('Development OTP:', data.dev_otp);
          }
        } else {
          // Direct success (fallback)
          setSuccess(true);
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        }
      } else {
        setError(data.error || data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification success
  const handleOTPVerificationSuccess = (data) => {
    setSuccess(true);
    setTimeout(() => {
      navigate("/login", { 
        state: { 
          message: "Email verified successfully! You can now log in with your secure account.",
          email: registrationEmail 
        }
      });
    }, 1500);
  };

  // Handle OTP resend
  const handleOTPResend = (data) => {
    // Show dev OTP in console if available (development mode)
    if (data.dev_otp) {
      console.log('Development OTP (resent):', data.dev_otp);
    }
  };

  // Show OTP verification screen if needed
  if (showOTPVerification) {
    return (
      <OTPVerification
        email={registrationEmail}
        type="signup"
        onVerificationSuccess={handleOTPVerificationSuccess}
        onResendOTP={handleOTPResend}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
      
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 flex flex-col items-center relative z-10">
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/10 rounded-3xl"></div>
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-3xl">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-indigo-100">
              <svg
                className="animate-spin h-10 w-10 text-indigo-600 mb-3 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              <span className="text-indigo-700 font-semibold text-center block">
                Creating your account...
              </span>
            </div>
          </div>
        )}
        
        {/* Content with relative positioning for glass effect */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <Logo variant="light" className="mb-6" />
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Your Account
            </h2>
            <p className="text-gray-600 text-lg font-medium">
              Join <span className="text-indigo-600 font-semibold">EduPlanner</span> and start your personalized learning journey
            </p>
          </div>
          {error && (
            <div className="w-full mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center font-medium shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="w-full mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center font-medium shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Account created successfully!</span>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-gray-800 font-semibold mb-2 text-sm tracking-wide uppercase"
                  htmlFor="firstName"
                >
                  First Name
                </label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm font-medium"
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  className="block text-gray-800 font-semibold mb-2 text-sm tracking-wide uppercase"
                  htmlFor="lastName"
                >
                  Last Name
                </label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm font-medium"
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-gray-800 font-semibold mb-2 text-sm tracking-wide uppercase"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm font-medium"
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="relative">
              <label
                className="block text-gray-800 font-semibold mb-2 text-sm tracking-wide uppercase"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm font-medium pr-12"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
            >
              {showPassword ? (
                // eye open icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                // eye closed icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c2.042 0 3.97.613 5.542 1.675M19.563 17.563A9.969 9.969 0 0121.542 12c0-1.657-.336-3.236-.938-4.675"
                  />
                </svg>
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {form.password && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              <div className="space-y-1">
                <div className={`text-xs flex items-center ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordStrength.length ? '✓' : '○'}</span>
                  At least 8 characters
                </div>
                <div className={`text-xs flex items-center ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordStrength.uppercase ? '✓' : '○'}</span>
                  One uppercase letter
                </div>
                <div className={`text-xs flex items-center ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordStrength.lowercase ? '✓' : '○'}</span>
                  One lowercase letter
                </div>
                <div className={`text-xs flex items-center ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordStrength.number ? '✓' : '○'}</span>
                  One number
                </div>
                <div className={`text-xs flex items-center ${passwordStrength.special ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordStrength.special ? '✓' : '○'}</span>
                  One special character
                </div>
              </div>
            </div>
          )}
          
          <div className="relative">
            <label
              className="block text-gray-800 font-semibold mb-2 text-sm tracking-wide uppercase"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400 bg-white/50 backdrop-blur-sm font-medium pr-12"
              type={showConfirm ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              disabled={loading}
            >
              {showConfirm ? (
                // eye open icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                // eye closed icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c2.042 0 3.97.613 5.542 1.675M19.563 17.563A9.969 9.969 0 0121.542 12c0-1.657-.336-3.236-.938-4.675"
                  />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            ) : null}
            {loading ? "Signing Up..." : "Sign Up →"}
          </button>
          </form>
          
          <p className="mt-6 text-center text-gray-600 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Log In
            </a>
          </p>
          <p className="mt-2 text-center text-gray-400 text-xs">
            By signing up, you agree to our{" "}
            <a
              href="/terms"
              className="underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;