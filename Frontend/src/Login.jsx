// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import styles from "./Login.module.css";
// import { toast } from "react-toastify";
// import imm4Logo from "./assets/imm4.png";
// import { BASE_URL } from "./url";
// import NavigationBar from "./Webpages/NavigationBar";
// import { ensureUserSession } from "./utils/sessionAuth";

// function Login() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [loginMode, setLoginMode] = useState("email");
//   const [formData, setFormData] = useState({ email: "", phone: "" });
//   const [loading, setLoading] = useState(false);
//   const [remember, setRemember] = useState(true);
//   const returnUrl = location.state?.returnUrl || sessionStorage.getItem('returnUrl');

//   useEffect(() => {
//     if (location.state?.returnUrl) {
//       sessionStorage.setItem("returnUrl", location.state.returnUrl);
//     }
//   }, [location.state]);

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     if (params.get("force") === "1") return;

//     // Check for token from Google OAuth redirect
//     const token = params.get("token");
//     if (token) {
//       localStorage.setItem("token", token);
//       // ✅ Fix: Set cookie explicitly for Live server so subsequent API calls don't fail (causes infinite loader)
//       document.cookie = `userToken=${token}; path=/; max-age=${7 * 24 * 60 * 60};`;
//       navigate("/myprofile", { replace: true });
//       return;
//     }

//     // Check for error
//     const error = params.get("error");
//     if (error) {
//       toast.error("Google authentication failed. Please try again.");
//       return;
//     }

//     const check = async () => {
//       try {
//         const sessionOk = await ensureUserSession();
//         if (sessionOk) {
//           navigate("/home", { replace: true });
//         }
//       } catch {}
//     };

//     check();
//   }, [location.search, navigate]);

//   const showToast = (message) => {
//     toast.success(message, {
//       position: "top-right",
//       autoClose: 3000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: false,
//       pauseOnFocusLoss: false,
//       draggable: false,
//     });
//   };

//   const redirectAfterLogin = (message, email, isNewUser) => {
//     showToast(message);

//     setTimeout(() => {
//       navigate(isNewUser ? "/myprofile" : "/home", {
//         state: email ? { email } : undefined,
//       });
//     }, 1000);
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const email = String(formData.email || "").trim();
//     const phone = String(formData.phone || "").trim();
//     const isPhoneMode = loginMode === "phone";

//     if (isPhoneMode && !phone) {
//       toast.error("Enter your mobile number");
//       return;
//     }

//     if (!isPhoneMode && !email) {
//       toast.error("Enter your email");
//       return;
//     }

//     try {
//       sessionStorage.setItem(`otp_pending:${isPhoneMode ? phone : email}`, "1");
//     } catch {}

//     setLoading(true);
//     try {
//       const payload = isPhoneMode
//         ? { phone, channel: "whatsapp" }
//         : { email, channel: "email" };

//       const res = await axios.post(
//         `${BASE_URL}/api/users/request-otp`,
//         payload,
//         { withCredentials: true }
//       );

//       if (res.status === 200) {
//         showToast(
//           res.data?.message || (isPhoneMode ? "OTP sent on WhatsApp successfully" : "OTP sent successfully")
//         );

//         setTimeout(() => {
//           navigate("/verify-otp", {
//             state: {
//               email: isPhoneMode ? "" : email,
//               phone: isPhoneMode ? phone : "",
//               channel: isPhoneMode ? "whatsapp" : "email",
//               remember,
//               returnUrl,
//             },
//           });
//         }, 1000);
//       } else {
//         toast.error(res.data?.message || "Something went wrong!");
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error(error.response?.data?.message || "Something went wrong!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <NavigationBar />
//       <div className={styles.loginContainer}>
//         <div className={styles.loginCard}>
//           <img src={imm4Logo} alt="Logo" className={styles.logo} />
//           <h2 className={styles.title}>Welcome Back</h2>
//           <p className={styles.subtitle}>Send OTP by email or WhatsApp, or sign in with Google.</p>

//           <div className={styles.modeSwitch}>
//             <button
//               type="button"
//               className={`${styles.modeBtn} ${loginMode === "email" ? styles.modeBtnActive : ""}`}
//               onClick={() => setLoginMode("email")}
//             >
//               Email OTP
//             </button>
//             <button
//               type="button"
//               className={`${styles.modeBtn} ${loginMode === "phone" ? styles.modeBtnActive : ""}`}
//               onClick={() => setLoginMode("phone")}
//             >
//               WhatsApp OTP
//             </button>
//           </div>

//           <form onSubmit={handleSubmit}>
//             {loginMode === "email" ? (
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email"
//                 className={styles.loginInput}
//                 required
//               />
//             ) : (
//               <>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   placeholder="Enter mobile number"
//                   className={styles.loginInput}
//                   required
//                 />
//                 <p className={styles.helperText}>Use country code, or enter 10-digit mobile number.</p>
//               </>
//             )}

//             <div className={styles.rememberRow}>
//               <label className={styles.remember}>
//                 <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
//                 <span>Remember me</span>
//               </label>
//             </div>

//             <button type="submit" className={styles.actionBtn} disabled={loading}>
//               {loading
//                 ? "Sending OTP..."
//                 : loginMode === "phone"
//                   ? "Send OTP on WhatsApp"
//                   : "Send OTP"}
//             </button>
//           </form>

//           <div className={styles.divider}>
//             <span>or</span>
//           </div>

//           <div className={styles.googleBlock}>
//             <a href={`${BASE_URL}/api/users/auth/google`} className={styles.googleBtn}>
//               Sign in with Google
//             </a>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default Login;


import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Login.module.css";
import { toast } from "react-toastify";
import imm4Logo from "./assets/iimagicanewlogo.png";
import { BASE_URL } from "./url";
import NavigationBar from "./Webpages/NavigationBar";

import { ensureUserSession } from "./utils/sessionAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const returnUrl = location.state?.returnUrl || sessionStorage.getItem("returnUrl");

  useEffect(() => {
    if (window.innerWidth <= 768) {
      window.scrollTo(20, 20);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (location.state?.returnUrl) {
      sessionStorage.setItem("returnUrl", location.state.returnUrl);
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("force") === "1") {
      setAuthChecked(true);
      return;
    }

    // Check for token from Google OAuth redirect
    const token = params.get("token");
    if (token) {
      // Save token in localStorage and cookies before verification
      localStorage.setItem("token", token);
      localStorage.setItem("isLoggedIn", "true");
      
      const domainSuffix = window.location.hostname.endsWith("iimagica.com") ? "; domain=.iimagica.com" : "";
      // Set cookies explicitly so subsequent API calls don't fail
      document.cookie = `userToken=${token}; path=/${domainSuffix}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
      document.cookie = `refreshToken=${token}; path=/${domainSuffix}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;

      // Legacy fallback: token passed as URL param (Google OAuth redirect)
      const verifyAndRedirect = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/profiles/me`, {
            withCredentials: true,
          });
          const profile = res.data?.profile || res.data;
          const isNew = !profile || !profile.profileType;
          const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");
          if (isNew || !hasLoggedInBefore) {
            localStorage.setItem("hasLoggedInBefore", "true");
            navigate("/myprofile", { replace: true });
          } else {
            navigate("/home", { replace: true });
          }
        } catch {
          const isNewUser = params.get("isNewUser") === "true";
          const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");
          if (isNewUser || !hasLoggedInBefore) {
            localStorage.setItem("hasLoggedInBefore", "true");
            navigate("/myprofile", { replace: true });
          } else {
            navigate("/home", { replace: true });
          }
        }
      };
      verifyAndRedirect();
      return;
    }

    // Check for error
    const error = params.get("error");
    if (error) {
      toast.error("Google authentication failed. Please try again.");
      setAuthChecked(true);
      return;
    }

    const check = async () => {
      try {
        const sessionOk = await ensureUserSession();
        if (sessionOk) {
          navigate("/home", { replace: true });
          return;
        }
      } catch (error) {
        void error;
      }

      setAuthChecked(true);
    };

    check();
  }, [location.search, navigate]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#F10D64]" />
      </div>
    );
  }

  const showToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      pauseOnFocusLoss: false,
      draggable: false,
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = String(formData.email || "").trim();
    const phone = String(formData.phone || "").trim();

    if (!email || !phone) {
      toast.error("Enter both email and mobile number");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    const phoneRegex = /^[+]?[\d\s()-]{8,}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Enter a valid mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/users/request-otp`,
        { email, phone, channel: "whatsapp", remember },
        { withCredentials: true }
      );

      if (res.status === 200) {
        const deliveryChannel = String(res.data?.channel || "whatsapp").toLowerCase();
        const destination = String(
          res.data?.destination || (deliveryChannel === "whatsapp" ? phone : email)
        ).trim();

        if (destination) {
          try {
            sessionStorage.setItem(`otp_pending:${destination}`, "1");
          } catch (error) {
            void error;
          }
        }

        showToast(res.data?.message || "OTP sent successfully");

        setTimeout(() => {
          navigate("/verify-otp", {
            state: {
              email: deliveryChannel === "email" ? destination || email : email,
              phone: deliveryChannel === "whatsapp" ? phone : "",
              channel: deliveryChannel,
              remember,
              returnUrl,
            },
          });
        }, 1000);
      } else {
        toast.error(res.data?.message || "Something went wrong!");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavigationBar />
      <div className={`${styles.loginContainer} min-h-[100vh]  flex items-center justify-center p-2 sm:p-6 md:p-8`}>
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-[420px] mx-auto -mt-10 bg-white rounded-xl sm:rounded-[24px] p-4 sm:p-7 md:p-8 transition-all duration-300 [box-shadow:0_10px_40px_rgba(241,28,107,0.11),0_0_30px_rgba(255,128,175,0.16)]">

          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-4">
            <img src={imm4Logo} alt="Brand Logo" className="h-11 sm:h-14 md:h-[80px] object-contain" />
          </div>

          <h2 className="text-base sm:text-xl md:text-[26px] font-bold text-center text-gray-800 mb-1 sm:mb-3">
            Welcome Back
          </h2>

          {/* <p className="text-center text-gray-500 text-sm mb-6 sm:mb-8">
            Enter your email and mobile number to receive OTP on WhatsApp. If
            WhatsApp delivery fails, we will automatically send the same OTP to
            your email.
          </p> */}

          {/* <div className="text-center text-xs font-semibold text-[#7C6FF7] bg-[#7C6FF7]/10 py-1.5 px-3 rounded-full mb-6 w-fit mx-auto">
            WhatsApp first, email fallback
          </div> */}

          <form className="space-y-3 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 ml-1" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white text-gray-800 text-xs sm:text-base"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 ml-1" htmlFor="login-phone">
                Mobile Number
              </label>
              <input
                id="login-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter mobile number"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white text-gray-800 text-xs sm:text-base"
                autoComplete="tel"
                inputMode="tel"
                required
              />
              {/* <p className="mt-2 text-xs text-gray-500 ml-1">
                Include country code if needed. WhatsApp is tried first, then
                email if delivery fails.
              </p> */}
            </div>

            <div className="flex items-center ml-1">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} className="w-4 h-4 text-[#f97316] border-gray-300 rounded focus:ring-[#f97316]" />
                <span className="ml-2 text-xs sm:text-sm text-gray-600">Remember me</span>
              </label>
            </div>

            <button type="submit" className="w-full py-2 sm:py-3 cursor-pointer text-white font-semibold rounded-lg sm:rounded-xl bg-[#FF7A30] hover:bg-[#FF9559] transition-colors disabled:opacity-50 text-[13px] sm:text-base" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <div className="relative flex items-center justify-center mt-4 sm:mt-6 mb-4 sm:mb-5">
            <div className="absolute inset-0 border-t border-gray-200 mt-2.5"></div>
            <span className="relative bg-white px-3 sm:px-4 text-xs sm:text-sm text-gray-400">or</span>
          </div>

          <div className="text-center">
            <a href={`${BASE_URL}/api/users/auth/google?origin=${window.location.origin}`} className="w-full flex items-center justify-center py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-[13px] sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Sign in with Google
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
