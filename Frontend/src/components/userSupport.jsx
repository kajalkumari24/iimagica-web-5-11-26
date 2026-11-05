import React, { useState } from "react";
import { Search, Sparkles, UserCircle, CreditCard, PenTool, ArrowRight, ChevronDown, MessageSquare, Mail, Headset } from "lucide-react";
import Select from "../assets/Select.png";
import { useNavigate } from "react-router-dom";

export default function UserSupport() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "What is included in the Basic Plan?",
      answer:
        "The Basic Plan is ideal for getting started. It includes weekly posts, access to major festival images, basic templates, and standard email support. Depending on your billing cycle (Monthly, Half-Yearly, or Yearly), you get increased limits on your greeting images.",
    },
    {
      question: "What do I get with the Advanced Plan?",
      answer:
        "The Advanced Plan is designed for active creators. It provides daily posts, access to both greeting and festival images (including special day content), seasonal templates, and priority email support.",
    },
    {
      question: "What are the benefits of the Premium Plan?",
      answer:
        "Our Premium Plan gives you unrestricted access to everything! This includes unlimited custom images and graphics, our advanced logo creation suite, business card & poster templates, premium frames, social media packs, and priority chat & email support.",
    },
    {
      question: "What billing cycles are available?",
      answer:
        "We offer flexible billing options for all our plans: Monthly, Half-Yearly (6 months), and Yearly. Choosing a longer billing cycle (like Yearly) often unlocks higher usage limits and extra features.",
    },
    {
      question: "How do I Get a new frame?",
      answer:
        "To create a new frame, simply select your profile type Political, Business, Professional, Social, or Brand. From there, you can easily customize your frame and instantly get access to hundreds of beautiful festival templates.",
    },
    {
      question: "Can I upgrade or change my plan later?",
      answer:
        "Absolutely! You can upgrade your plan or change your billing cycle at any time from the 'My Subscription' or 'Billing & Plans' section in your account. Your new features will be unlocked immediately.",
    },
    {
      question: "Will I get a refund if I cancel my plan?",
      answer:
        "No, our subscription plans are non-refundable. Once a plan is activated or renewed, the amount paid cannot be refunded.",
    },
  ];

  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index, e) => {
    e.preventDefault();
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[#fcfeff] font-sans text-slate-800 antialiased overflow-x-hidden pb-10">

      <main>
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">

          
          <div className="max-w-4xl mx-auto px-6 md:px-10 text-center relative z-10">
            <h1 className="text-4xl font-poppins md:text-[44px] font-semibold text-slate-900 mb-6">
              How can we help?
            </h1>
            <p className="text-lg text-slate-600 mb-0 max-w-[720px] mx-auto">
              Explore guides, tutorials, and support articles to make the most of iimagica's creative tools.
            </p>
            
            {/* SEARCH SECTION COMMENTED OUT
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-violet-600 transition-colors" />
              <input
                className="w-full pl-16 pr-8 py-5 bg-white border-none shadow-[0_4px_24px_rgba(71,85,105,0.06)] rounded-full text-base focus:ring-2 focus:ring-violet-600/20 transition-all placeholder:text-slate-400 outline-none"
                placeholder="Search for answers..."
                type="text"
              />
            </div>
            
            <div className="mt-8 flex justify-center gap-3 flex-wrap items-center">
              <span className="text-xs font-medium text-slate-500">Popular:</span>
              <a className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-violet-600 hover:bg-violet-100 transition-colors" href="#">Frame templates</a>
              <a className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-violet-600 hover:bg-violet-100 transition-colors" href="#">Billing issue</a>
              <a className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-violet-600 hover:bg-violet-100 transition-colors" href="#">Vector export</a>
            </div>
            */}
          </div>
        </section>

        {/* Support Categories */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-violet-600/20 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Email Support</h3>
              <p className="text-sm text-slate-600">Need help? Drop us an email and our support team will get back to you.</p>
            </div>
            
            <div className="group p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-violet-600/20 transition-all duration-300">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 text-pink-600 group-hover:scale-110 transition-transform">
                <UserCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">My Account</h3>
              <p className="text-sm text-slate-600">Manage your profile, password, security, and connected devices.</p>
            </div>
            
            <div className="group p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-violet-600/20 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Billing & Plans</h3>
              <p className="text-sm text-slate-600">Everything about subscriptions, invoices, and plan upgrades.</p>
            </div>
            
            <div className="group p-8 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-violet-600/20 transition-all duration-300">
              <div className="w-14 h-14 bg-violet-200 rounded-xl flex items-center justify-center mb-6 text-violet-800 group-hover:scale-110 transition-transform">
                <PenTool className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Design Tools</h3>
              <p className="text-sm text-slate-600">Deep dive into editor tools, brushes, and AI generation features.</p>
            </div>
          </div>
        </section>

        {/* Popular FAQs */}
        <section className="bg-slate-50 py-14">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl md:text-[34px] font-poppins font-semibold text-slate-900">Popular FAQs</h2>
              <a className="text-[#F11C6B] text-lg font-medium flex items-center gap-1 hover:gap-2 transition-all" href="#">
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details 
                  key={index} 
                  className="group bg-white rounded-xl shadow-sm border border-gray-200" 
                  open={openFaq === index} 
                  onClick={(e) => toggleFaq(index, e)}
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-lg font-semibold text-slate-800 group-open:text-[#D90B5A] transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </summary>
                  {openFaq === index && (
                    <div className="px-6 pb-6 pt-0 text-slate-600 border-t border-slate-100 mt-2 pt-4">
                      <p className="leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* "Still need help?" Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center bg-white border border-slate-100 shadow-xl rounded-[1rem] p-8 lg:p-12 relative overflow-hidden">
            {/* Abstract Decoration */}
            <div className="absolute top-0 right-0 w-[140px] h-[140px] md:w-64 md:h-64 bg-violet-400/20 blur-[100px]"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-[32px] font-poppins font-semibold text-slate-900 mb-6">Still need help?</h2>
              <p className="text-[17px] text-slate-600 mb-10 max-w-lg">
                Our support team is available 24/7 to help you with any questions or technical issues you might encounter. We're just a click away!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate('/contact');
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F11C6B] text-white rounded-xl text-base font-semibold hover:bg-[#D90B5A] transition-all active:scale-95 shadow-lg shadow-violet-600/20"
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat with Us
                </button>
                <button 
                  onClick={() => {
                    const subject = encodeURIComponent("Support Request");
                    const body = encodeURIComponent("Hello iimagica team,\n\nI need assistance with:\n\n");
                    window.location.href = `mailto:iimagica.samprakshi@gmail.com?subject=${subject}&body=${body}`;
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-base font-semibold hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                >
                  <Mail className="w-5 h-5" />
                  Email Support
                </button>
              </div>
            </div>
            
            <div className="relative flex justify-center mt-10 lg:mt-0">
              <img 
                alt="Support Illustration" 
                className="w-full max-w-md h-auto object-contain rounded-2xl shadow-2xl" 
              src={Select}
              />
              {/* Floating UI Element decoration */}
              <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
                <div className="w-8 h-8 bg-gradient-to-tr from-[#D90B5A] to-orange-500 rounded-full flex items-center justify-center text-white">
                  <Headset className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">Online Now</p>
                  <p className="text-[9px] text-slate-500">Response in 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}