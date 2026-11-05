import React, { useState } from "react";
import axios from "axios";
import {
  Modal,
  Card,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import imm4Logo from "../assets/imm4.png";
import { BASE_URL } from "../url";

const LoginModal = ({ open, onClose }) => {
  const [step, setStep] = useState("email"); // 'email' or 'otp'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/users/request-otp`, { email }, { withCredentials: true });
      toast.success("OTP sent successfully!");
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/users/verify-otp`, {
        email,
        otp,
      }, { withCredentials: true });
      toast.success("Login Successful ✅");
      onClose();
      // Reset state after a short delay to allow the modal to close
      setTimeout(() => {
        setStep("email");
        setEmail("");
        setOtp("");
      }, 300);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
        await axios.post(`${BASE_URL}/api/users/request-otp`, { email }, { withCredentials: true });
        toast.success("OTP re-sent successfully!");
    } catch (err) {
        toast.error(err.response?.data?.message || "Error re-sending OTP");
    } finally {
        setLoading(false);
    }
  };


  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setStep("email");
        setEmail("");
        setOtp("");
    }, 300);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Card sx={{ padding: 4, position: "relative", width: 400 }}>
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <Close />
        </IconButton>

        <Box sx={{ textAlign: "center", marginBottom: 2 }}>
          <img src={imm4Logo} alt="Logo" style={{ height: 40 }} />
        </Box>

        {step === "email" && (
          <>
            <Typography variant="h5" component="h2" gutterBottom>
              Login
            </Typography>
            <TextField
              fullWidth
              label="Enter your email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendOtp}
              disabled={loading}
              sx={{ marginTop: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Send OTP"}
            </Button>
          </>
        )}

        {step === "otp" && (
          <>
            <Typography variant="h5" component="h2" gutterBottom>
              Verify OTP
            </Typography>
            <TextField
              fullWidth
              label="Enter OTP"
              variant="outlined"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyOtp}
              disabled={loading}
              sx={{ marginTop: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
            <Button
                fullWidth
                variant="text"
                onClick={handleResendOtp}
                disabled={loading}
                sx={{ marginTop: 1 }}
            >
                {loading ? <CircularProgress size={24} /> : "Resend OTP"}
            </Button>
          </>
        )}
      </Card>
    </Modal>
  );
};

export default LoginModal;
