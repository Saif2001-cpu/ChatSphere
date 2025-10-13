import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    profileImage: null,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (id === "profileImage") {
      const file = files[0];
      setFormData({ ...formData, profileImage: file });
      setImagePreview(file ? URL.createObjectURL(file) : null);
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const validate = () => {
    const newErrors = {};
    // Username validation
    const username = formData.username;
    if (username.length < 4) newErrors.username = "Username must be at least 4 characters long.";

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email format is invalid.";
    }
    // Password validation
    const password = formData.password;
    if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters long.";
    else if (!/[A-Z]/.test(password))
      newErrors.password = "Password must contain at least one uppercase letter.";
    else if (!/[a-z]/.test(password))
      newErrors.password = "Password must contain at least one lowercase letter.";
    else if (!/[0-9]/.test(password))
      newErrors.password = "Password must contain at least one number.";
    else if (!/[!@#$%^&*]/.test(password))
      newErrors.password = "Password must contain at least one special character.";
    else if (!formData.password) newErrors.password = "Password is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload ={
      username: formData.username,
      email:formData.email,
      password:formData.password
    }

    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      console.log(data);
      setErrors({});
      const alertDiv = document.createElement("div");
      alertDiv.className = "alert alert-success mt-3";
      alertDiv.role = "alert";
      alertDiv.innerText = "Registration successful! Please log in.";
      document.querySelector(".card").prepend(alertDiv);
      setTimeout(() => {
        alertDiv.remove();
        window.location.href = "/login";
      }, 2000);
      
    } catch (error) {
      setErrors({ api: error.message });
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4 w-50 mx-auto">
        <h2 className="text-center mb-4">Create Your Account</h2>
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label">User Name</label>
            <input
              type="text"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              id="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your name"
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

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
                placeholder="Choose a secure password"
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

          {/* Profile Image */}
          <div className="mb-3">
            <label htmlFor="profileImage" className="form-label">Profile Image</label>
            <input
              type="file"
              className="form-control"
              id="profileImage"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="text-center mb-3">
              <img src={imagePreview} alt="Preview" className="img-thumbnail" style={{ maxWidth: "150px" }} />
              <p className="text-muted mt-2">Image Preview</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="d-grid">
            <button type="submit" className="btn btn-primary">Register</button>
          </div>

           <div className="mb-3">
           <Link to="/">Already have an account? Login</Link>
          
          </div>
        </form>
      </div>
    </div>
  );
}

