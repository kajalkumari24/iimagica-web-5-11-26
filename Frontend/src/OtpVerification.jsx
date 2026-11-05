
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import style from "./OtpVerification.module.css";
import { toast } from "react-toastify";
import { BASE_URL } from "./url";
import { clearAuthToken } from "./utils/auth";
import imm4Logo from "./assets/iimagicanewlogo.png";

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const phone = location.state?.phone;
  const channel = location.state?.channel || (phone ? "whatsapp" : "email");
  const remember = location.state?.remember ?? true;
  const returnUrl = location.state?.returnUrl || sessionStorage.getItem('returnUrl');
  const destination = phone || email;

  useEffect(() => {
    if (!destination) {
      navigate("/LoginPage", { replace: true });
    }
  }, [destination, navigate]);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Auto-trigger verification once OTP is complete
  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === 4 && otp.every((d) => d !== "")) {
      handleVerify(otpCode);
    }
  }, [otp]);

  // Full-screen OTP page: remove global header offset
  useEffect(() => {
    document.body.classList.add("no-header-offset");
    return () => {
      document.body.classList.remove("no-header-offset");
    };
  }, []);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to next input automatically
    if (value && index < otp.length - 1) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pasteData)) {
      setOtp(pasteData.split(""));
      const last = document.getElementById(`otp-3`);
      if (last) last.focus();
    } else {
      toast.error("Please paste a valid 4-digit OTP");
    }
  };

  const showToastAndNavigate = (msg, path) => {
    toast.success(msg, {
      position: "top-right",
      autoClose: 3000,
      theme: "dark",
    });

    setTimeout(() => {
      // When a new user, open the consolidated profile page
      if (path === "/profile-selection") {
        navigate(`/myprofile`, { state: email ? { email } : phone ? { phone } : undefined });
      } else {
        navigate(path, { state: email ? { email } : phone ? { phone } : undefined });
      }
    }, 3000);
  };

  const handleVerify = async (otpCodeFromEffect) => {
    const otpCode = otpCodeFromEffect || otp.join("");
    if (otpCode.length !== 4) return;

    setVerifyLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, channel, otp: otpCode, remember }),
      });

      const data = await res.json();

      if (res.ok) {
        // Cookie-based auth; clear any legacy stored token
        clearAuthToken();
        localStorage.setItem("isLoggedIn", "true");

        // clear the pending OTP marker for this email (verification completed)
        try { sessionStorage.removeItem(`otp_pending:${destination}`); } catch (err) { }

        // After storing the token, verify whether the user already has a profile.
        try {
          const resp = await fetch(`${BASE_URL}/api/profiles/me`, {
            method: "GET",
            credentials: "include",
          });

          // parse response body to detect new user
          const respJson = await resp.json().catch(() => ({}));

          const isNew = respJson?.isNew || !respJson?.profile || !respJson?.profile?.profiletype;
          const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");

          if (isNew || !hasLoggedInBefore) {
            localStorage.setItem("hasLoggedInBefore", "true");
            // New user -> open MyProfile so they can create their profile
            showToastAndNavigate(data.message || "OTP Verified!", "/myprofile");
          } else {
            // Existing user -> go home or returnUrl
            const redirectUrl = returnUrl || "/home";
            sessionStorage.removeItem("returnUrl");
            showToastAndNavigate(data.message || "OTP Verified!", redirectUrl);
          }
        } catch (err) {
          console.error("Error checking profile existence:", err);
          // Fallback to backend flag or default behavior
          const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");
          if (data.isNewUser || !hasLoggedInBefore) {
            localStorage.setItem("hasLoggedInBefore", "true");
            showToastAndNavigate(data.message || "OTP Verified!", "/myprofile");
          } else {
            const redirectUrl = returnUrl || "/home";
            sessionStorage.removeItem("returnUrl");
            showToastAndNavigate(data.message || "OTP Verified!", redirectUrl);
          }
        }
      } else {
        toast.error(data.message || "Invalid OTP", { position: "top-right", theme: "dark" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!", { position: "top-right", theme: "dark" });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, channel }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "OTP resent successfully!", { theme: "dark" });
      } else {
        toast.error(data.message || "Failed to resend OTP", { theme: "dark" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!", { theme: "dark" });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={`bg-gray-50 min-h-[100vh] flex items-center justify-center p-4 sm:p-6 md:p-8`}>
      <div className="relative z-10 w-full max-w-[350px] sm:max-w-[432px] mx-auto -mt-10 bg-white rounded-2xl sm:rounded-[24px] p-4 sm:p-6 md:p-7 text-center transition-all duration-300 [box-shadow:0_10px_40px_rgba(241,28,107,0.11),0_0_30px_rgba(255,128,175,0.16)]">
        <img src={imm4Logo} alt="logo" className="mx-auto mb-4 sm:mb-5 h-10 sm:h-12 md:h-[68px] object-contain" />
        <h2 className="text-lg sm:text-xl md:text-[26px] font-bold text-center text-gray-800 mb-2">OTP Verification</h2>
        <p className="mb-5 sm:mb-6 text-sm text-gray-500">
          Code sent to <span className="font-medium text-gray-700">{destination}</span>
          {channel === "whatsapp" ? " on WhatsApp" : ""}
        </p>

        <div className="mb-5 sm:mb-6 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-gray-300 bg-white text-gray-800 text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          ))}
        </div>

        {/* 🔹 Hide verify button since auto-verify */}
        {verifyLoading && <div className="flex justify-center mb-4"><div className={style.loader}></div></div>}

        <button
          onClick={() => handleVerify()}
          disabled={verifyLoading || otp.join("").length !== 4}
          className="w-full py-2 sm:py-2.5 cursor-pointer text-white font-semibold rounded-xl bg-[#FF7A30] hover:bg-[#FF9559] hover:opacity-90 transition-all disabled:opacity-50 text-sm sm:text-base"
        >
          {verifyLoading ? "Verifying..." : "Verify OTP"}
        </button>

        <p
          onClick={!resendLoading ? handleResend : null}
          className={`mt-4 text-sm transition-colors ${
            !resendLoading
              ? "cursor-pointer text-gray-500 hover:text-[#f97316]"
              : "cursor-not-allowed text-gray-400"
          }`}
        >
          {resendLoading ? "Sending..." : "Resend OTP"}
        </p>
      </div>
    </div>
  );
}
