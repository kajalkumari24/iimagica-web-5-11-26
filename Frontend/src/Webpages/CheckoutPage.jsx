
// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../url";
// import { User, Zap, Crown } from "lucide-react";

// const formatBilling = (value = "") => {
//   const lower = String(value).toLowerCase();
//   if (lower.includes("half")) return "Half-Yearly";
//   if (lower.includes("year")) return "Yearly";
//   return "Monthly";
// };

// const formatType = (value = "") => {
//   const lower = String(value).toLowerCase();
//   if (lower.includes("premium")) return "Premium";
//   if (lower.includes("advance") || lower.includes("adv")) return "Advance";
//   return "Basic";
// };

// const loadRazorpayScript = () =>
//   new Promise((resolve) => {
//     if (window.Razorpay) return resolve(true);

//     const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
//     if (existing) {
//       existing.addEventListener("load", () => resolve(true), { once: true });
//       existing.addEventListener("error", () => resolve(false), { once: true });
//       return;
//     }

//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.async = true;
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });

// export default function CheckoutPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const [plans, setPlans] = useState([]);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [paying, setPaying] = useState(false);
//   const [message, setMessage] = useState("");
//   const [messageType, setMessageType] = useState("");

//   const planId = location.state?.plan?.id || searchParams.get("planId") || "";

//   useEffect(() => {
//     if (messageType !== "success") return undefined;

//     const timeoutId = window.setTimeout(() => {
//       navigate("/home", {
//         replace: true,
//         state: {
//           showReviewPopup: true,
//         },
//       });
//     }, 1800);

//     return () => window.clearTimeout(timeoutId);
//   }, [messageType, navigate, planId]);

//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         const [plansRes, meRes] = await Promise.all([
//           axios.get(`${BASE_URL}/api/plans/all`, { withCredentials: true }),
//           axios.get(`${BASE_URL}/api/users/me`, { withCredentials: true }),
//         ]);

//         setPlans(Array.isArray(plansRes.data) ? plansRes.data.filter((item) => item?.isActive !== false) : []);
//         setUser(meRes.data?.user || null);
//       } catch (error) {
//         console.error("Failed to load checkout data", error);
//         setMessage("Unable to load checkout details.");
//         setMessageType("error");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   const selectedPlan = useMemo(() => {
//     if (location.state?.plan?.id && String(location.state.plan.id) === String(planId)) {
//       return location.state.plan;
//     }

//     const match = plans.find((item) => String(item._id) === String(planId));
//     if (!match) return null;

//     return {
//       id: match._id,
//       name: match.name,
//       price: match.price,
//       duration: match.duration,
//       billing: formatBilling(match.billing),
//       planType: formatType(match.planType),
//       icon: match.icon || "*",
//       features: Array.isArray(match.features) ? match.features : [],
//       link: match.link,
//     };
//   }, [location.state, planId, plans]);

//   const handlePayNow = async () => {
//     if (!selectedPlan?.id) {
//       setMessage("Please select a valid plan.");
//       setMessageType("error");
//       return;
//     }

//     const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
//     if (!keyId) {
//       setMessage("Razorpay key is missing in frontend env.");
//       setMessageType("error");
//       return;
//     }

//     setPaying(true);
//     setMessage("");
//     setMessageType("");

//     try {
//       const scriptLoaded = await loadRazorpayScript();
//       if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

//       const orderRes = await axios.post(
//         `${BASE_URL}/api/payments/create-order`,
//         { planId: selectedPlan.id },
//         { withCredentials: true }
//       );

//       const { order, plan, user: checkoutUser } = orderRes.data;
//       const razorpay = new window.Razorpay({
//         key: keyId,
//         amount: order.amount,
//         currency: order.currency,
//         name: "Imagica",
//         description: `${formatType(plan.planType)} ${formatBilling(plan.billing)} Plan`,
//         order_id: order.id,
//         prefill: {
//           name: checkoutUser?.name || user?.email?.split("@")[0] || "Customer",
//           email: checkoutUser?.email || user?.email || "",
//           contact: checkoutUser?.contact || user?.phone || "",
//         },
//         notes: order.notes,
//         theme: { color: "#1d4ed8" },
//         handler: async (response) => {
//           try {
//             const verifyRes = await axios.post(
//               `${BASE_URL}/api/payments/verify`,
//               { ...response, planId: selectedPlan.id },
//               { withCredentials: true }
//             );
//             setMessage(verifyRes.data?.message || "Payment completed successfully.");
//             setMessageType("success");
//             setPlans((currentPlans) =>
//               currentPlans.map((item) =>
//                 String(item._id) === String(selectedPlan.id)
//                   ? { ...item, isCurrentPlan: true }
//                   : item
//               )
//             );
//           } catch (verifyError) {
//             console.error("Payment verification failed", verifyError);
//             setMessage(
//               verifyError?.response?.data?.message || "Payment captured but verification failed."
//             );
//             setMessageType("error");
//           } finally {
//             setPaying(false);
//           }
//         },
//         modal: {
//           ondismiss: () => {
//             setPaying(false);
//             setMessage("Payment was cancelled.");
//             setMessageType("error");
//           },
//         },
//       });

//       razorpay.on("payment.failed", (response) => {
//         console.error("Razorpay payment failed", response?.error);
//         setPaying(false);
//         setMessage(
//           response?.error?.description ||
//             response?.error?.reason ||
//             "Payment failed on Razorpay. Please try again."
//         );
//         setMessageType("error");
//       });

//       razorpay.open();
//     } catch (error) {
//       console.error("Unable to start payment", error);
//       setMessage(error?.response?.data?.message || error.message || "Unable to start payment.");
//       setMessageType("error");
//       setPaying(false);
//     }
//   };

//   return (
    
//     <div className="w-full max-w-[1100px] mx-auto px-2 md:px-4">
  
//   {/* HEADER */}
//   <div className="mb-8  md:mb-14 text-left">
    
//     <p className="text-[11px] md:text-lg font-semibold tracking-[2px] text-indigo-500 uppercase mt-7 mb-1">
//       Secure Checkout
//     </p>

//     <h1 className="text-[26px] sm:text-[34px] md:text-[44px] font-bold text-gray-900 leading-tight mb-1.5">
//       Complete your subscription
//     </h1>

//     <p className="text-[13px] md:text-lg -mb-4 text-gray-500 max-w-[500px] leading-relaxed">
//       Review your plan details and continue to Razorpay payment.
//     </p>

//         {loading && <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 text-center font-medium text-gray-600">Loading checkout details...</div>}

//         {!loading && !selectedPlan && (
//           <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 text-center">
//             <p className="mb-4 text-gray-600 font-medium">No plan selected for checkout.</p>
//             <button className="w-full md:w-auto py-3 px-5 rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200" onClick={() => navigate("/pricing")}>
//               Back to Pricing
//             </button>
//           </div>
//         )}

//         {!loading && selectedPlan && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 mt-5 md:mt-10">
//             <section className="bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
//               <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-7 pb-4 md:pb-6 border-b-2 border-gray-100">
//                 <span className="text-[28px] md:text-[40px] leading-none flex items-center justify-center w-[45px] h-[45px] md:w-[60px] md:h-[60px] bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg md:rounded-xl text-white font-bold">{selectedPlan.billing?.toLowerCase() === "monthly" ? <User /> : selectedPlan.billing?.toLowerCase() === "half-yearly" ? <Zap /> : <Crown />}</span>
//                 <div className="flex-1">
//                   <h2 className="text-base md:text-xl font-bold text-gray-800 mb-0.5 md:mb-1">{selectedPlan.planType} Plan</h2>
//                   <p className="text-xs md:text-[13px] text-gray-400 font-medium tracking-[0.5px]">{selectedPlan.billing}</p>
//                 </div>
//               </div>

//               <div className="flex items-baseline gap-2 mb-4 md:mb-7 p-3 md:p-5 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-lg md:rounded-xl">
//                 <span className="text-[24px] md:text-4xl font-extrabold text-gray-800 leading-none">Rs {selectedPlan.price}</span>
//                 <small className="text-xs md:text-sm text-gray-500 font-medium">{selectedPlan.duration}</small>
//               </div>

//               <ul className="flex flex-col gap-2 md:gap-3 list-none p-0 m-0">
//                 {(selectedPlan.features || []).map((feature, index) => (
//                   <li key={`${feature}-${index}`} className="text-[13px] md:text-sm text-gray-700 pl-5 md:pl-6 relative leading-relaxed font-medium before:content-['✓'] before:absolute before:left-0 before:text-emerald-500 before:font-bold before:text-base">{feature}</li>
//                 ))}
//               </ul>
//             </section>

//             <section className="bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
//               <h3 className="text-[15px] md:text-lg font-bold text-gray-800 mb-3 md:mb-5 pb-3 md:pb-4 border-b-2 border-gray-100">Billing Details</h3>
//               <div className="flex justify-between items-center py-2.5 md:py-3.5 border-b border-gray-100 text-xs md:text-sm">
//                 <span className="text-gray-500 font-medium">Customer</span>
//                 <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">{user?.email || "Logged-in user"}</strong>
//               </div>
//               <div className="flex justify-between items-center py-2.5 md:py-3.5 border-b border-gray-100 text-xs md:text-sm">
//                 <span className="text-gray-500 font-medium">Plan</span>
//                 <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">{selectedPlan.planType} / {selectedPlan.billing}</strong>
//               </div>
//               <div className="flex justify-between items-center py-2.5 md:py-3.5 border-b border-gray-100 text-xs md:text-sm">
//                 <span className="text-gray-500 font-medium">Amount</span>
//                 <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">Rs {selectedPlan.price}</strong>
//               </div>
//               <div className="flex justify-between items-center py-2.5 md:py-3.5 text-xs md:text-sm">
//                 <span className="text-gray-500 font-medium">Gateway</span>
//                 <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">Razorpay</strong>
//               </div>

//               {message && (
//                 <div className={`p-3 md:p-4 rounded-lg my-4 md:my-5 text-xs md:text-[13px] font-medium leading-relaxed ${messageType === "success" ? "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800" : "bg-red-100 border-l-4 border-red-500 text-red-900"}`}>
//                   {message}
//                 </div>
//               )}

//               {messageType === "success" && (
//                 <p className="text-[11px] md:text-xs text-emerald-600 text-center mt-2 md:mt-3 -mb-1 md:-mb-2 animate-pulse">Redirecting to your subscription details...</p>
//               )}

//               <button className="w-full py-3 md:py-3.5 px-3.5 md:px-5 border-none rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wider mt-4 md:mt-5 bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_3px_10px_rgba(99,102,241,0.3)] md:shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_4px_15px_rgba(99,102,241,0.4)] md:hover:not(:disabled):shadow-[0_6px_25px_rgba(99,102,241,0.5)] active:not(:disabled):translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handlePayNow} disabled={paying}>
//                 {paying ? "Processing..." : "Pay Now"}
//               </button>

//               <button className="w-full py-3 md:py-3.5 px-3.5 md:px-5 rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wider mt-3 md:mt-4 bg-gray-100 text-gray-700 border border-gray-300 hover:not(:disabled):bg-gray-200 hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:not(:disabled):translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => navigate(-1)} disabled={paying}>
//                 Back
//               </button>
//             </section>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../url";
import { User, Zap, Crown } from "lucide-react";
import CheckoutSkeleton from "./CheckoutSkeleton";
import NavigationBar from "./NavigationBar";
import Footers from "./Footers";

const formatBilling = (value = "") => {
  const lower = String(value).toLowerCase();
  if (lower.includes("half")) return "Half-Yearly";
  if (lower.includes("year") || lower.includes("annual")) return "Annually";
  if (lower.includes("quarter")) return "Quarterly";
  return "Monthly";
};

const formatType = (value = "") => {
  const lower = String(value).toLowerCase();
  if (lower.includes("premium")) return "Premium";
  if (lower.includes("advance") || lower.includes("adv")) return "Advance";
  return "Basic";
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [payHovered, setPayHovered] = useState(false);

  const planId = location.state?.plan?.id || searchParams.get("planId") || "";

  useEffect(() => {
    if (messageType !== "success") return undefined;

    const timeoutId = window.setTimeout(() => {
      navigate("/home", {
        replace: true,
        state: {
          showReviewPopup: true,
        },
      });
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [messageType, navigate, planId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [plansRes, meRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/plans/all`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/users/me`, { withCredentials: true }),
        ]);

        setPlans(Array.isArray(plansRes.data) ? plansRes.data.filter((item) => item?.isActive !== false) : []);
        setUser(meRes.data?.user || null);
      } catch (error) {
        console.error("Failed to load checkout data", error);
        setMessage("Unable to load checkout details.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedPlan = useMemo(() => {
    if (location.state?.plan?.id && String(location.state.plan.id) === String(planId)) {
      return location.state.plan;
    }

    const match = plans.find((item) => String(item._id) === String(planId));
    if (!match) return null;

    return {
      id: match._id,
      name: match.name,
      price: match.price,
      duration: match.duration,
      billing: formatBilling(match.billing),
      planType: formatType(match.planType),
      icon: match.icon || "*",
      features: Array.isArray(match.features) ? match.features : [],
      link: match.link,
    };
  }, [location.state, planId, plans]);

  const handlePayNow = async () => {
    if (!selectedPlan?.id) {
      setMessage("Please select a valid plan.");
      setMessageType("error");
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
    if (!keyId) {
      setMessage("Razorpay key is missing in frontend env.");
      setMessageType("error");
      return;
    }

    setPaying(true);
    setMessage("");
    setMessageType("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

      const orderRes = await axios.post(
        `${BASE_URL}/api/payments/create-order`,
        { planId: selectedPlan.id },
        { withCredentials: true }
      );

      const { order, plan, user: checkoutUser } = orderRes.data;
      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Imagica",
        description: `${formatType(plan.planType)} ${formatBilling(plan.billing)} Plan`,
        order_id: order.id,
        prefill: {
          name: checkoutUser?.name || user?.email?.split("@")[0] || "Customer",
          email: checkoutUser?.email || user?.email || "",
          contact: checkoutUser?.contact || user?.phone || "",
        },
        notes: order.notes,
        theme: { color: "#1d4ed8" },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              `${BASE_URL}/api/payments/verify`,
              { ...response, planId: selectedPlan.id },
              { withCredentials: true }
            );
            setMessage(verifyRes.data?.message || "Payment completed successfully.");
            setMessageType("success");
            setPlans((currentPlans) =>
              currentPlans.map((item) =>
                String(item._id) === String(selectedPlan.id)
                  ? { ...item, isCurrentPlan: true }
                  : item
              )
            );
          } catch (verifyError) {
            console.error("Payment verification failed", verifyError);
            setMessage(
              verifyError?.response?.data?.message || "Payment captured but verification failed."
            );
            setMessageType("error");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setMessage("Payment was cancelled.");
            setMessageType("error");
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed", response?.error);
        setPaying(false);
        setMessage(
          response?.error?.description ||
            response?.error?.reason ||
            "Payment failed on Razorpay. Please try again."
        );
        setMessageType("error");
      });

      razorpay.open();
    } catch (error) {
      console.error("Unable to start payment", error);
      setMessage(error?.response?.data?.message || error.message || "Unable to start payment.");
      setMessageType("error");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <div>
          <NavigationBar />
          <div className="p-3 md:p-5 flex items-center justify-center mt-6 md:mt-10">
            <div className="w-full max-w-[1100px] mx-auto">
              <div className="flex flex-col items-center text-center mb-6 md:mb-10 animate-pulse">
                <div className="h-3 md:h-4 w-24 md:w-32 bg-indigo-200 rounded mb-3 md:mb-4"></div>
                <div className="h-7 sm:h-8 md:h-10 w-64 sm:w-80 md:w-[450px] bg-gray-300 rounded mb-3 md:mb-4"></div>
                <div className="h-4 md:h-5 w-56 sm:w-72 md:w-96 bg-gray-200 rounded"></div>
              </div>
              <CheckoutSkeleton />
            </div>
          </div>
        </div>
        <Footers />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <NavigationBar />
        <div className="p-3 md:p-5 flex items-center justify-center mt-6 md:mt-1.5">
          <div className="w-full max-w-[1100px] mx-auto">
        <div className="text-center mb-6 md:mb-10">
          <p className="text-[11px] md:text-lg font-semibold tracking-[1.5px] text-[#FF7A30] uppercase mb-1">Secure Checkout</p>
          <h1 className="text-[20px] sm:text-[24px] md:text-[40px] font-bold mb-2 md:mb-2 tracking-tight">Complete your subscription</h1>
          <p className="text-[13px] md:text-base text-gray-500 leading-relaxed">Review your plan details and continue to Razorpay payment.</p>
        </div>

        {!selectedPlan && (
          <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 text-center">
            <p className="mb-4 text-gray-600 font-medium">No plan selected for checkout.</p>
            <button className="w-full md:w-auto py-3 px-5 rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200" onClick={() => navigate("/pricing")}>
              Back to Pricing
            </button>
          </div>
        )}

        {selectedPlan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 max-w-[990px] mx-auto">
            <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-7 pb-4 md:pb-6 border-b-2 border-gray-100">
                <span className="text-[28px] md:text-[40px] leading-none flex items-center justify-center w-[45px] h-[45px] md:w-[60px] md:h-[60px] text-[#FF7A30]">
                  {selectedPlan.billing?.toLowerCase() === "monthly"
                    ? <User />
                    : (selectedPlan.billing?.toLowerCase() === "quarterly" || selectedPlan.billing?.toLowerCase() === "half-yearly")
                    ? <Zap />
                    : <Crown />}
                </span>
                <div className="flex-1">
                  <h2 className="text-base md:text-xl font-bold text-gray-800 mb-0.5 md:mb-1">{selectedPlan.planType} Plan</h2>
                  <p className="text-xs md:text-[13px] text-gray-400 font-medium tracking-[0.5px]">{selectedPlan.billing}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4 md:mb-7 p-3 md:p-5 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-lg md:rounded-xl">
                <span className="text-[24px] md:text-4xl font-extrabold text-gray-800 leading-none">Rs {selectedPlan.price}</span>
                <small className="text-xs md:text-sm text-gray-500 font-medium">{selectedPlan.duration}</small>
              </div>

              <ul className="flex flex-col gap-2 md:gap-3 list-none p-0 m-0">
                {(selectedPlan.features || []).map((feature, index) => (
                  <li key={`${feature}-${index}`} className="text-[13px] md:text-sm text-gray-700 pl-5 md:pl-6 relative leading-relaxed font-medium before:content-['✓'] before:absolute before:left-0 before:text-emerald-500 before:font-bold before:text-base">{feature}</li>
                ))}
              </ul>
            </section>

            <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
              <h3 className="text-[15px] md:text-lg font-bold text-gray-800 mb-3 md:mb-5 pb-3 md:pb-4 border-b-2 border-gray-100">Billing Details</h3>
              <div className="flex justify-between items-center py-2.5 md:py-3.5 border-b border-gray-100 text-xs md:text-sm">
                <span className="text-gray-500 font-medium">Customer</span>
                <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">{user?.email || "Logged-in user"}</strong>
              </div>
              <div className="flex justify-between items-center py-2.5 md:py-3.5 border-b border-gray-100 text-xs md:text-sm">
                <span className="text-gray-500 font-medium">Plan</span>
                <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">{selectedPlan.planType} / {selectedPlan.billing}</strong>
              </div>
              <div className="flex justify-between items-center py-2.5 md:py-3.5 border-b border-gray-100 text-xs md:text-sm">
                <span className="text-gray-500 font-medium">Amount</span>
                <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">Rs {selectedPlan.price}</strong>
              </div>
              <div className="flex justify-between items-center py-2.5 md:py-3.5 text-xs md:text-sm">
                <span className="text-gray-500 font-medium">Gateway</span>
                <strong className="text-gray-800 font-semibold text-right break-words max-w-[45%] md:max-w-[50%]">Razorpay</strong>
              </div>

              {message && (
                <div className={`p-3 md:p-4 rounded-lg my-4 md:my-5 text-xs md:text-[13px] font-medium leading-relaxed ${messageType === "success" ? "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800" : "bg-red-100 border-l-4 border-red-500 text-red-900"}`}>
                  {message}
                </div>
              )}

              {messageType === "success" && (
                <p className="text-[11px] md:text-xs text-emerald-600 text-center mt-2 md:mt-3 -mb-1 md:-mb-2 animate-pulse">Redirecting to your subscription details...</p>
              )}

              <button
                onMouseEnter={() => setPayHovered(true)}
                onMouseLeave={() => setPayHovered(false)}
                className="w-full py-3 md:py-3.5 px-3.5 md:px-5 border-none rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wider mt-4 md:mt-5 text-white active:not(:disabled):translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed hover:not(:disabled):-translate-y-0.5"
                style={{
                  background: payHovered ? "#FF9559" : "#FF7A30",
                  boxShadow: payHovered
                    ? "0 6px 25px rgba(255, 122, 48, 0.5)"
                    : "0 4px 15px rgba(255, 122, 48, 0.4)",
                }}
                onClick={handlePayNow}
                disabled={paying}
              >
                {paying ? "Processing..." : "Pay Now"}
              </button>

              <button className="w-full py-3 md:py-3.5 px-3.5 md:px-5 rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wider mt-3 md:mt-4 bg-gray-100 text-gray-700 border border-gray-300 hover:not(:disabled):bg-gray-200 hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:not(:disabled):translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => navigate(-1)} disabled={paying}>
                Back
              </button>
            </section>
          </div>
        )}
          </div>
        </div>
      </div>
      <Footers />
    </div>
  );
}