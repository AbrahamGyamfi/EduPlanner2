import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = ({ onLogin }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    console.log("Login attempt with:", { email, password: "***" });

    try {
      console.log("Sending request to backend...");
      // Try without credentials first since the server doesn't appear to support them
      const response = await fetch("http://127.0.0.1:5000/login", {
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
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error(`Server responded with status: ${response.status}. ${errorText || ''}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Check for success in the response
      if (data.status === "success") {
        console.log("Login successful, storing user data");
        localStorage.setItem("firstname", data.user.firstname);
        localStorage.setItem("userId", data.user.id || data.user._id);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin?.();
        navigate("/dashboard");
      } else {
        console.error("Login failed:", data.error);
        setError(data.error || "Login failed. Check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-gradient-to-br from-gray-100 to-blue-100">
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent p-5">
        <h1 className="text-3xl font-bold text-gray-800 mb-5">📚 EduPlanner</h1>
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
          <h2 className="text-2xl font-bold mb-2">Welcome back 👋</h2>
          <p className="text-gray-600 mb-4">Log in to your account</p>
          {error && <p className="text-red-500 mb-4">{error}</p>}

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
            Don't have an account? <Link to="/signup" className="text-green-600 font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;