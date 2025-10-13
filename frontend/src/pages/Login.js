import React, { useState } from "react";
import { Link } from "react-router-dom";
export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } 

    const password = formData.password;
    if (!password) {
      newErrors.password = "Password is required.";
    } 
    return newErrors;
  };
  const loginUser = async (payload) => {
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const data = await response.json();
      console.log(data);
      if (data?.access_token) {
        window.location.href = "/home";
        sessionStorage.setItem("jwt", data.access_token);
        sessionStorage.setItem("user_id", data.user_id);
      }

    } catch (error) {
      setErrors({ api: error.message });
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4 w-50 mx-auto">
        <h2 className="text-center mb-4">Login to Your Account</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const validationErrors = validate();
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
          } else {
            setErrors({});
            await loginUser(formData);
          }
        }} noValidate>
          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                id="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="d-grid">
            <button type="submit" className="btn btn-primary" >Login</button>
          </div>

          <div className="mb-3">
            <Link to="/register">Don't have an account? Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

