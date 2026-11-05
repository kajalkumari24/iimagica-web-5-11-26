
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios"; // Import the configured Axios instance
import { BASE_URL } from "../url";
import Header from "../page/Header/Header";
import BottomNavbar from '../components/BottomNavbar';
import socket from "../socket";

const SubscriptionPage = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveTime, setLiveTime] = useState({ days: 0, hours: 0, minutes: 0, expired: false });
  const [successMessage, setSuccessMessage] = useState(
    location.state?.paymentSuccess ? "Payment successful. Your subscription is now active." : ""
  );

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const hasValidExpiry = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  };

  const getTrialDuration = (start, end) => {
    if (!start || !end) return "30 Days";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return `${days} Days`;
  };

  useEffect(() => {
    let mounted = true;
    const fetchSubscription = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/subscriptions/me`, {
          withCredentials: true,
        });
        if (!mounted) return;
        if (res.data.subscription) {
          setSubscription(res.data.subscription);
        }
      } catch (error) {
        console.error("Failed to load subscription:", error.response?.data?.message || error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSubscription();

    // 🟢 Listen for real-time subscription updates
    const handleSocket = () => {
      if (mounted) fetchSubscription();
    };
    socket.on('subscriptionUpdated', handleSocket);
    return () => {
      mounted = false;
      socket.off('subscriptionUpdated', handleSocket);
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
      if (location.state?.paymentSuccess) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage, navigate, location.pathname, location.state]);

  useEffect(() => {
    if (!subscription || !subscription.expiryDate) return;

    const calculateTime = () => {
      const diffMs = new Date(subscription.expiryDate).getTime() - new Date().getTime();
      if (diffMs <= 0) {
        setLiveTime({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        setLiveTime({
          days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
          expired: false
        });
      }
    };

    calculateTime(); // Pehli baar turant calculate karega
    const timer = setInterval(calculateTime, 1000); // Har 1 second me time update hoga
    return () => clearInterval(timer);
  }, [subscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 antialiased flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F10D64] border-t-transparent mb-3"></div>
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased pb-24"> {/* homeStyles.container */}
      {/* Removed Lottie animation and its wrapper */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* homeStyles.content */}
        <Header />
        <div className="h-20 md:h-24 w-full shrink-0"></div>
        <main className="w-full flex justify-center mt-1"> {/* main style */}
          <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8"> {/* styles.mainContainer */}
            <div className="mb-6 text-center"> {/* styles.pageHeader */}
              <h1 className="text-4xl font-bold">My Subscription</h1> {/* styles.pageTitle */}
            </div>
            <p className="text-lg text-gray-600 mb-8 text-center">Manage your subscription plan and upgrade anytime</p> {/* styles.pageSubtitle */}

            {successMessage && (
              <div style={{
                width: "100%",
                marginTop: "20px",
                padding: "14px 18px",
                borderRadius: "12px",
                background: "rgba(20, 83, 45, 0.35)",
                border: "1px solid rgba(74, 222, 128, 0.24)", // This is a specific rgba, keeping it as is for now
                color: "#bbf7d0",
                fontWeight: "600",
              }}>
                {successMessage}
              </div>
            )}
            {/* Converted successMessage div to Tailwind */}
            {subscription && (
              <div className="w-full bg-white border border-gray-200 rounded-2xl p-8 mt-8 shadow-lg"> {/* subscription div */}

            <img
  src="https://ik.imagekit.io/jevqsl8rn/home-slides/upload-1776239967633_hru0C7JX9.png"
  alt="Subscription Banner"
  className="w-full h-[159px] object-cover rounded-xl mb-3"
/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"> {/* subscription inner grid div */}
                  {/* Current Plan Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
  <p className="text-gray-500 text-xs font-semibold font-poppins uppercase mb-1 tracking-wide">
    Current Plan
  </p>

  <h2 className="text-gray-900 text-xl font-bold mb-2">
    {subscription.currentPlan === 'free_trial' ? 'Free Trial' :
     subscription.currentPlan === 'free' ? 'Free Plan' :
     subscription.planDetails?.name || 'Unknown Plan'}
  </h2>

  <div className={`inline-block px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide ${
    (subscription.currentPlan === 'free_trial' && !liveTime.expired)
      ? 'bg-green-100 border border-green-200 text-green-600'
      : (subscription.subscriptionStatus === 'active' && !liveTime.expired)
        ? 'bg-yellow-100 border border-yellow-200 text-yellow-600'
        : 'bg-red-100 border border-red-200 text-red-600'
  }`}>
    {(subscription.currentPlan === 'free_trial' && !liveTime.expired) ? 'Active Trial' :
     (subscription.subscriptionStatus === 'active' && !liveTime.expired) ? 'Active' : 'Expired'}
  </div>
</div>

                  {/* Duration/Days Left */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-center"> {/* Duration/Days Left div */}
                    <p className="text-gray-500 text-[12px] font-poppins font-semibold uppercase mb-3 tracking-wide"> {/* Duration/Days Left p */}
                      {liveTime.expired
                        ? 'Expiry Date'
                        : (liveTime.days === 0 ? 'Time Remaining' : 'Days Remaining')}
                    </p>
                    <h2 className="text-gray-900 text-2xl font-bold m-0"> {/* Duration/Days Left h2 */}
                      {liveTime.expired
                        ? (hasValidExpiry(subscription.expiryDate) ? formatDate(subscription.expiryDate) : 'N/A')
                        : (liveTime.days === 0
                            ? `${liveTime.hours}h ${liveTime.minutes}m ${liveTime.seconds}s`
                            : `${liveTime.days} day${liveTime.days !== 1 ? 's' : ''}`)}
                    </h2>
                  </div>
                </div>

                {/* Details Section */}
                {(subscription.isFreeTrialActive || subscription.planDetails) && ( 
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8"> {/* Details Section div */}
                    <h3 className=" text-base font-bold mb-4 uppercase tracking-wide"> {/* Plan Details h3 */}
                      Plan Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Details Section inner grid div */}
                      {subscription.isFreeTrialActive && (
                        <>
                          <div>
                            <p className="text-gray-500 text-sm mb-1"> {/* Inner p tags (labels) */}
                              Start Date
                            </p>
                            <p className="text-gray-900 text-sm font-semibold m-0"> {/* Inner p tags (values) */}
                              {hasValidExpiry(subscription.startDate) ? formatDate(subscription.startDate) : 'N/A'}
                            </p>
                          </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">
                            Expiry Date
                          </p>
                          <p className="text-gray-900 text-sm font-semibold m-0">
                            {hasValidExpiry(subscription.expiryDate) ? formatDate(subscription.expiryDate) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">
                              Trial Duration
                            </p>
                            <p className="text-gray-900 text-sm font-semibold m-0">
                            {getTrialDuration(subscription.startDate, subscription.expiryDate)}
                            </p>
                          </div>
                        </>
                      )}
                      {subscription.planDetails && (
                        <>
                          <div>
                            <p className="text-gray-500 font-semibold font-poppins text-xs mb-1">
                              Plan Type
                            </p>
                            <p className="text-gray-900 text-sm font-semibold m-0">
                              {subscription.planDetails.planType || 'Premium'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-semibold font-poppins text-xs mb-1">
                              Billing Cycle
                            </p>
                            <p className="text-gray-900 text-sm font-semibold m-0">
                              {subscription.planDetails.billing || 'Monthly'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-semibold font-poppins text-xs mb-1">
                              Expires On
                            </p>
                            <p className="text-gray-900 text-sm font-semibold m-0">
                              {hasValidExpiry(subscription.expiryDate) ? formatDate(subscription.expiryDate) : 'N/A'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap"> {/* Action Buttons div */}
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate('/pricing');
                    }}
                    className="px-8 py-3 bg-[#FF7A30] border-none text-white rounded-lg text-base font-bold cursor-pointer transition-all duration-150 ease-in-out flex-1 min-w-[180px] hover:bg-[#FF9559] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-300/50"
                  >
                    {subscription.currentPlan === 'free' || subscription.currentPlan === 'free_trial'
                      ? 'Upgrade Plan'
                      : 'Change Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/myprofile')}
                    className="px-8 py-3 bg-gray-100 border border-gray-200 rounded-lg text-base font-bold cursor-pointer transition-all duration-150 ease-in-out flex-1 min-w-[180px] hover:bg-gray-200 hover:-translate-y-0.5" /* Back to Profile button */
                  >
                    Back to Profile
                  </button>
                </div>
              </div>
            )}
            {!subscription && !loading && ( 
              <div className="mt-8 p-6 bg-gray-50 border border-gray-100 rounded-xl text-center"> {/* No subscription information div */}
                No subscription information available.
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNavbar isAuthenticated={true} />
    </div>
  );
};

export default SubscriptionPage;
