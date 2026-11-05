
import React, { useEffect, useState } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { User, Zap, Crown } from "lucide-react";
import NavigationBar from "../NavigationBar";
import axios from "axios";
import { BASE_URL } from "../../url";
import { ensureUserSession } from "../../utils/sessionAuth";

const billingOrder = {
  monthly: 1,
  quarterly: 2,
  "half-yearly": 3,
  yearly: 4,
  annually: 4,
};

const PricingSkeleton = () => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-10 animate-pulse relative z-10">
    {/* Skeleton Heading */}
    <div className="h-10 md:h-12 w-64 bg-gray-300 rounded-xl mb-12"></div>

    {/* Skeleton Cards Container */}
    <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-8 w-full max-w-7xl">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/80 rounded-3xl border border-gray-200 p-6 lg:p-8 flex flex-col shadow-sm w-full md:flex-1 min-h-[400px] md:min-h-[480px]">

          {/* Header (Icon + Title) */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
            <div className="h-8 w-32 bg-gray-300 rounded-md"></div>
          </div>

          {/* Price */}
          <div className="mb-8 flex items-baseline gap-2">
            <div className="h-10 lg:h-12 w-24 bg-gray-300 rounded-md"></div>
            <div className="h-4 w-16 bg-gray-200 rounded-md"></div>
          </div>

          {/* Features list */}
          <div className="flex-1 space-y-5 mb-10">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full"></div>
              </div>
            ))}
          </div>

          {/* Button */}
          <div className="w-full h-12 bg-gray-300 rounded-xl mt-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function Pricing() {
  const navigate = useNavigate();
  const [allPlans, setAllPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const sessionOk = await ensureUserSession();
        if (mounted) setIsAuth(sessionOk);
      } catch {
        if (mounted) setIsAuth(false);
      }
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  // 🔥 Auto change pages
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 API CALL - Fetch all plans and current subscription
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const plansRes = await axios.get(`${BASE_URL}/api/plans/all`, { withCredentials: true });

        // Map API plans to UI format
        const formatted = Array.isArray(plansRes.data)
          ? plansRes.data
            .filter((p) => p?.isActive !== false)
            .map((p) => ({
              id: p._id,
              type: (p.planType || p.name || "").toLowerCase(),
              title: p.name || "Plan",
              price: `₹${p.price || "0"}`,
              period: p.duration || "Per Month",
              features: p.features || [],
              icon:
                p.billing?.toLowerCase() === "monthly"
                  ? <User />
                  : p.billing?.toLowerCase() === "quarterly"
                    ? <Zap />
                    : p.billing?.toLowerCase() === "half-yearly"
                      ? <Zap />
                      : <Crown />,
              billing: p.billing || "monthly",
              link: p.link,
            }))
            .sort(
              (a, b) =>
                (billingOrder[a.billing.toLowerCase()] || 99) -
                (billingOrder[b.billing.toLowerCase()] || 99)
            )
          : [];

        setAllPlans(formatted);
      } catch (err) {
        console.error("Failed to load plans:", err);
        setAllPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // 🔥 API CALL - Fetch user's current active subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const subRes = await axios.get(`${BASE_URL}/api/subscriptions/me`, { withCredentials: true });
        if (subRes.data && subRes.data.success && subRes.data.subscription) {
          setSubscription(subRes.data.subscription);
        }
      } catch (err) {
        console.error("Failed to load user subscription:", err);
      }
    };
    fetchSubscription();
  }, []);

  const getPlanButtonInfo = (plan) => {
    const hasActiveSub = subscription && subscription.subscriptionStatus === "active";
    const userActivePlan = subscription?.currentPlan?.toLowerCase();
    const isCurrentPlan = hasActiveSub && userActivePlan === plan.billing?.toLowerCase();

    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        isCurrent: true,
        style: {
          background: "#E5E7EB",
          color: "#000000",
          boxShadow: "none",
          transform: "none",
          cursor: "not-allowed",
        },
      };
    }

    return {
      text: hasActiveSub ? "Upgrade Plan" : "Get Started",
      isCurrent: false,
      style: null,
    };
  };

  // ✅ Group plans by type (basic, advance, premium)
  const groupedPlans = useMemo(() => {
    const basic = allPlans.filter((p) => p.type === "basic");
    const advance = allPlans.filter((p) => p.type === "advance");
    const premium = allPlans.filter((p) => p.type === "premium");

    return [basic, advance, premium];
  }, [allPlans]);

  const headings = ["Basic Plans", "Advanced Plans", "Premium Plans"];

  // ✅ Render plans cards (Desktop)
  const renderPlans = (plans, type) => (
    <div className="flex flex-col md:flex-row items-stretch justify-center gap-[22px] lg:gap-[30px] max-w-[1280px] mx-auto w-full">
      {plans.map((plan, idx) => {
        const btnInfo = getPlanButtonInfo(plan);
        return (
          <React.Fragment key={plan.id || idx}>
            <div className="bg-white backdrop-blur-xl rounded-3xl border border-gray-200 p-[22px] lg:p-[30px] flex flex-col w-full md:flex-1 md:min-w-0 md:w-0 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 hover:ring-2 hover:ring-purple-200/50 ring-1 ring-transparent z-10">

              <div className="flex items-center gap-2.5 mb-[18px]">
                <span
                  className={`text-2xl ${plan.billing?.toLowerCase() === "monthly"
                      ? "text-green-600"
                      : plan.billing?.toLowerCase() === "quarterly"
                        ? "text-indigo-600"
                        : plan.billing?.toLowerCase() === "half-yearly"
                          ? "text-purple-700"
                          : "text-yellow-500"
                    }`}
                >
                  {plan.icon}
                </span>

                <h2 className="text-[21px] font-poppins whitespace-nowrap font-semibold text-gray-900 tracking-wide">
                  {plan.title}
                </h2>
              </div>

              <div className="mb-[28px] flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-[35px] lg:text-[44px] font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500">• {plan.period}</span>
              </div>

              <ul className="flex-1 space-y-4 mb-[30px]">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex gap-3 font-poppins items-start text-gray-800">
                    <CheckCircle className="w-[19px] h-[19px] text-[#FF7A30] mt-1 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onMouseEnter={() => !btnInfo.isCurrent && setHoveredIndex(`${type}-${idx}`)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (btnInfo.isCurrent) return;
                  if (!isAuth) {
                    navigate("/LoginPage", { state: { returnUrl: "/pricing" } });
                    return;
                  }
                  navigate("/checkout", {
                    state: {
                      plan: {
                        id: plan.id,
                        name: plan.title,
                        price: plan.price.replace("₹", ""),
                        duration: plan.period,
                        billing: plan.billing,
                        planType: plan.title,
                        features: plan.features,
                        link: plan.link,
                      },
                    },
                  });
                }}
                disabled={btnInfo.isCurrent}
                className={`w-full py-3 rounded-xl font-poppins font-semibold text-sm tracking-wide transition-all duration-300 ${btnInfo.isCurrent ? "cursor-not-allowed text-black bg-gray-200" : "cursor-pointer text-white"
                  }`}
                style={
                  btnInfo.isCurrent
                    ? btnInfo.style
                    : {
                      background:
                        hoveredIndex === `${type}-${idx}`
                          ? "#FF9559"
                          : "#FF7A30",

                      boxShadow:
                        hoveredIndex === `${type}-${idx}`
                          ? "0 0 30px rgba(255, 122, 48, 0.4), 0 8px 20px rgba(255, 122, 48, 0.2)"
                          : "0 4px 15px rgba(255, 122, 48, 0.2)",

                      transform:
                        hoveredIndex === `${type}-${idx}`
                          ? "translateY(-2px) scale(1.03)"
                          : "translateY(0) scale(1)",
                    }
                }
              >
                {btnInfo.text}
              </button>
            </div>

            {idx !== plans.length - 1 && (
              <div className="hidden md:block w-[2px] flex-shrink-0 self-stretch bg-[linear-gradient(to_bottom,#EE9B6F_0%,#F66520_30%,#EE247D_100%)]"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ✅ Render plans cards (Mobile/Tablet stacked)
  const renderPlansStacked = (plans, type) => (
    <div className="flex flex-col gap-[22px]">
      {plans.map((plan, idx) => {
        const btnInfo = getPlanButtonInfo(plan);
        return (
          <div
            key={plan.id || idx}
            className="bg-white/95 border border-gray-200 rounded-3xl p-[22px] sm:p-[30px] min-h-[304px] sm:min-h-[332px] md:min-h-[399px] flex flex-col shadow-sm hover:shadow-xl transition-all duration-500 relative z-10"
          >
            <div className="flex items-center gap-2 mb-[11px]">
              <span
                className={`text-xl ${type === 0
                  ? "text-green-600"
                  : type === 1
                    ? "text-purple-700"
                    : "text-yellow-500"
                  }`}
              >
                {plan.icon}
              </span>
              <h3 className="text-[18px] font-semibold text-gray-900 tracking-tight">{plan.title}</h3>
            </div>
            <div className="flex items-baseline gap-2 mb-[15px] text-gray-600">
              <span className="text-[29px] font-bold text-gray-900">{plan.price}</span>
              <span className="text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-[22px] text-sm text-gray-700 flex-1">
              {(plan.features || []).map((f, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <CheckCircle className="w-[15px] h-[15px] text-[#FF7A30] mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                if (btnInfo.isCurrent) return;
                if (!isAuth) {
                  navigate("/LoginPage", { state: { returnUrl: "/pricing" } });
                  return;
                }
                navigate("/checkout", {
                  state: {
                    plan: {
                      id: plan.id,
                      name: plan.title,
                      price: plan.price.replace("₹", ""),
                      duration: plan.period,
                      billing: plan.billing,
                      planType: plan.title,
                      features: plan.features,
                      link: plan.link,
                    },
                  },
                });
              }}
              disabled={btnInfo.isCurrent}
              className={`w-full py-3 mt-auto rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 ${btnInfo.isCurrent
                  ? "cursor-not-allowed text-black bg-gray-200"
                  : "cursor-pointer text-white bg-[#FF7A30] hover:bg-[#FF9559] shadow-lg shadow-orange-200/70 hover:shadow-orange-300/80"
                }`}
              style={btnInfo.isCurrent ? btnInfo.style : undefined}
            >
              {btnInfo.text}
            </button>

          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-gray-50 overflow-hidden relative">
      <NavigationBar />
      {/* BLOBS */}
      <div
        className="absolute w-[180px] h-[180px] rounded-full top-[40px] left-[60px] z-0"
        style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }}
      />

      <div
        className="absolute w-[130px] h-[130px] rounded-full top-[100px] right-[80px] z-0"
        style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }}
      />

      <div
        className="absolute w-[140px] h-[140px] rounded-full bottom-[120px] left-[10%] z-0"
        style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }}
      />

      <div
        className="absolute w-[150px] h-[150px] rounded-full bottom-[60px] right-[60px] z-0"
        style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }}
      />

      {/* LOADING STATE */}
      {loading && (
        <PricingSkeleton />
      )}

      {/* MOBILE / TABLET STACKED CARDS */}
      {!loading && (
        <>
          <div className="lg:hidden px-4 pb-10 space-y-6 relative z-10 w-[85%] sm:w-[76%] md:w-[76%] mx-auto">
            <h2 className="text-3xl font-bold font-poppins tracking-wide mt-12 text-center text-gray-800">
              Subscription Plans
            </h2>
            {allPlans.length > 0 ? (
              renderPlansStacked(allPlans, 0)
            ) : (
              <p className="text-center text-gray-600 text-lg">No active plans available</p>
            )}
          </div>

          {/* SINGLE VIEW FOR ALL PLANS */}
          <div className="hidden lg:flex flex-col items-center justify-center min-h-[75vh] w-screen px-6 mb-10 mt-6">
            <h2 className="text-4xl lg:text-[46px] font-poppins font-semibold mb-12 tracking-wide text-gray-900 text-center">
              Our Subscription Plans
            </h2>
            <div className="max-w-[1330px] w-full">
              {allPlans.length > 0 ? (
                renderPlans(allPlans, 0)
              ) : (
                <p className="text-center font-poppins text-gray-600 text-lg">
                  No active plans available
                </p>
              )}
            </div>
          </div>

          {/* THANK YOU SECTION */}
          <div className="text-center my-16">
            <h2
              className="text-4xl lg:text-[52px] font-poppins text-gray-900 mb-6"
            >
              Thank You for Choosing iimagica
            </h2>
            <p className="text-gray-800 text-lg font-poppins lg:text-lg max-w-2xl mx-auto">
              We are thrilled to have you with us! Explore unlimited possibilities to create stunning greetings, images, and designs for every occasion. Your creativity is now unstoppable with iImagica.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
