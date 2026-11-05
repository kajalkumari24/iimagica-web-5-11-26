import React, { useState } from "react";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../url";
import { clearAuthToken } from "../utils/auth";
import styles from "./AdminLogin.module.css";

function AdminLogin() {
  const [formData, setFormData] = useState({ adminId: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/admins/login`,
        { ...formData, remember },
        { withCredentials: true }
      );
      if (res.status === 200) {
        // Prefer HttpOnly cookie auth; clear any legacy stored tokens
        clearAuthToken("adminToken");
        navigate("/admin/home", { replace: true });
      } else {
        setMessage(res.data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Admin Login Error:", err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setMessage(serverMsg);
      } else if (!err.response) {
        setMessage("Network error: Server unreachable. Check if backend is running.");
      } else {
        setMessage("Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'8px'}}>
          <div className={styles.logo}>
            IM
          </div>
          <h2 className={styles.title}>Admin Login</h2>
          <div className={styles.subtitle}>Sign in to manage frames, users and content</div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div style={{position:'relative'}}>
            <label htmlFor="adminId" className="sr-only">Admin ID</label>
            <input
              id="adminId"
              type="text"
              name="adminId"
              placeholder="Enter Admin ID"
              value={formData.adminId}
              onChange={handleChange}
              className={styles.input}
              required
              autoFocus
            />
          </div>

          <div style={{position:'relative'}}>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className={styles.pwToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>

          <div className={styles.controlsRow}>
            <label style={{display:'inline-flex',alignItems:'center',gap:'8px',color:'#475569'}}>
              <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        {message && (
          <div className={styles.messageWrapper} aria-live="polite">
            <div className={`${styles.message} ${message.toLowerCase().includes('successful') ? styles.success : styles.error}`}>
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
