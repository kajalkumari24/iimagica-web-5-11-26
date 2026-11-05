
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✅ Import ProtectedRoute (handles both user & admin)
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AdminLayout from "./Admin/AdminLayout";

import LandingPage from "./Webpages/LandingPage";
import Login from "./Login";
import OtpVerification from "./OtpVerification";
// import ProfileSelection from "./ProfileSelection";
// import ProfileBussi from "./SidebarComponents/ProfileBussi";
// import ProfileProf from "./SidebarComponents/ProfileProf";
// import ProfilePersonal from "./SidebarComponents/ProfilePersonal";
// import ProfileSocial from "./SidebarComponents/ProfileSocial";
// import HelpSupport from "./SidebarComponents/HelpSupport";
// import Home from "./page/Home/Home";
import Homes from "./page/Home/Homes";
import CategoryPage from "./components/CategoryPage";
import Edit from "./components/Edit";
// import ImageGallery from "./components/ImageCustom";
// import CreateLogo from "./components/CreateLogo";
// import VisitingCard from "./components/VisitingCard";
import UserProfileSettings from "./SidebarComponents/UserProfileSettings";
import SubscriptionPage from "./SidebarComponents/SubscriptionPage";
// import Services from "./Webpages/Services";
import OurServices from "./Webpages/Services/OurServices";
import AboutWrapper from "./Webpages/AboutWrapper";
import Contact from "./Webpages/Contact";
import Calendar from "./Calendar";
// import LogoCreation from "./Webpages/Services/LogoCreation";
// import Visiting from "./Webpages/Services/Visiting";
//  // import DesignGallery from "./Webpages/Services/DesignGallery";
import LogoCreations from "./Webpages/Services/LogoCreations";
import WebsiteTemplates from "./Webpages/Services/WebsiteTemplate";
import VisitingCards from "./Webpages/Services/VisitingCard";
import Banners from "./Webpages/Services/Banners";
import DigitalCards from "./Webpages/Services/DigitalCards";
import Templates from "./Webpages/Services/Template";
// import BasicPlan from "./Webpages/Pricings/BasicPlan";
// import AdvPlan from "./Webpages/Pricings/AdvPlans";
// import PremiumPlan from "./Webpages/Pricings/PremiumPlan";
// import AllPlans from "./Webpages/Pricings/AllPlans";
import Pricing from "./Webpages/Pricings/pricings";
import Introduction from "./Webpages/Abouts/Introduction";
import MissionVision from "./Webpages/Abouts/MissionVision";
import WhyChooseUs from "./Webpages/Abouts/WhyChooseUs";
import ImageView from "./components/ImageView";
import Work from "./Webpages/Abouts/Work";
import UserSupport from "./components/userSupport";
import PrivacyPolicy from "./Webpages/PrivacyPolicy";
import TermsConditions from "./Webpages/TermsConditions";
import TermsAndConditions from "./components/TermsAndConditions";
import RefundPolicy from "./Webpages/RefundPolicy";
import CheckoutPage from "./Webpages/CheckoutPage";
import TermsAndConditionsAdmin from "./Admin/TermsAndConditionsAdmin";
import AdminLogin from "./Admin/AdminLogin";
import AdminManageBlogs from "./Admin/AdminManageBlogs";
import AdminHome from "./Admin/AdminHome";
import ManageFrames from "./Admin/ManageFrames";
import ManageImages from "./Admin/ManageImages";
import ManageNotifications from "./Admin/ManageNotifications";
import AdminUsers from "./Admin/AdminUsers";
import AdminUserProfiles from "./Admin/AdminUserProfiles";
import AdminFeedback from "./Admin/AdminFeedback";
import AdminReviews from "./Admin/AdminReviews";
import AdminContact from "./Admin/AdminContact";
import CategoryManagement from "./Admin/CategoryManagement";
import AdminAnalytics from "./Admin/AdminAnalytics";
import SendPushNotification from "./Admin/SendPushNotification";
import ManageCalendar from "./Admin/ManageCalendar";
import ManageLogoTemplates from "./Admin/ManageLogoTemplates";
import ManageWebsiteTemplates from "./Admin/ManageWebsiteTemplates";
import ManageVisitingCards from "./Admin/ManageVisitingCards";
import ManageDigitalCards from "./Admin/ManageDigitalCards";
import ManageTemplates from "./Admin/ManageTemplates";
import ManageHomeSlides from "./Admin/ManageHomeSlides";
import AdminManageBanners from "./Admin/AdminManageBanners";
import DesignCategory from "./Admin/DesignCategory";
import AdminPlans from "./Admin/AdminPlans";
import AdminSubscriptionDetails from "./Admin/AdminSubscriptionDetails";
import AdminPrivacyPolicy from "./Admin/AdminPrivacyPolicy";
import Footers from "./Webpages/Footers";
import Notification from "./SidebarComponents/Notification";
import BlogPage from "./Webpages/BlogPage";
import BlogDetailPage from "./Webpages/BlogDetailPage";

function RouteConfig() {
  return (
    <Routes>
      <Route path="/footers" element={<Footers />} />
      {/* 🌐 Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/logout" element={<LandingPage />} />
      <Route path="/LoginPage" element={<Login />} />
      <Route path="/verify-otp" element={<OtpVerification />} />
      <Route path="/adminlogin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 🧩 Profile Creation */}
      {/* <Route path="/profile-selection" element={<ProfileSelection />} />
      <Route path="/profile-selection/profile-bus" element={<ProfileBussi />} />
      <Route path="/profile-selection/profile-prof" element={<ProfileProf />} />
      <Route path="/profile-selection/profile-personal" element={<ProfilePersonal />} />
      <Route path="/profile-selection/profile-social" element={<ProfileSocial />} /> */}
      <Route
        path="/myprofile"
        element={
          <ProtectedRoute><UserProfileSettings /></ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute><SubscriptionPage /></ProtectedRoute>
        }
      />

      {/* 🖼️ Image / Logo / Card Pages */}
      {/* <Route path="/create-logo" element={<CreateLogo />} />
      <Route path="/create-digital-card" element={<VisitingCard />} /> */}
      <Route
        path="/image-view"
        element={
          <ProtectedRoute>
            <ImageView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/image-view/:category"
        element={
          <ProtectedRoute>
            <ImageView />
          </ProtectedRoute>
        }
      />

      {/* 🌍 Website Pages */}
      <Route element={<Layout />}>
        {/* <Route path="services" element={<Services />} /> */}
        <Route path="services/our-services" element={<OurServices />} />
        <Route path="services/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
        <Route path="services/logos" element={<ProtectedRoute><LogoCreations /></ProtectedRoute>} />
        <Route path="services/website" element={<ProtectedRoute><WebsiteTemplates /></ProtectedRoute>} />
        <Route path="services/visiting-card" element={<ProtectedRoute><VisitingCards /></ProtectedRoute>} />
        <Route path="services/digital-card" element={<ProtectedRoute><DigitalCards /></ProtectedRoute>} />
        <Route path="services/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        {/* <Route path="services/:designSlug" element={<DesignGallery />} /> */}
        <Route path="about" element={<AboutWrapper />} />
        <Route path="contact" element={<Contact />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="blogs/:slug" element={<BlogDetailPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-conditions" element={<TermsConditions />} />
        <Route path="terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="refund-policy" element={<RefundPolicy />} />
        {/* <Route path="logo" element={<LogoCreation />} />
        <Route path="visiting" element={<Visiting />} />
        <Route path="website-temp" element={<WebsiteTemp />} /> */}
        <Route path="user-support" element={<UserSupport />} />
        <Route path="work" element={<Work />} />
        <Route path="introduction" element={<Introduction />} />
        <Route path="mission-vision" element={<MissionVision />} />
        <Route path="why-choose-us" element={<WhyChooseUs />} />
        <Route path="pricing" element={<Pricing />} />

        {/* <Route path="pricing" element={<AllPlans />} />
        <Route path="basic-plan" element={<BasicPlan />} />
        <Route path="advance-plan" element={<AdvPlan />} />
        <Route path="premium-plan" element={<PremiumPlan />} /> */}
      </Route>

      {/* 🏠 Protected User Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            {/* <Home /> */}
            <Homes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notification"
        element={
          <ProtectedRoute>
            <Notification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Calendar onClose={() => window.history.back()} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category/:category"
        element={
          <ProtectedRoute>
            <CategoryPage />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/help"
        element={
          <ProtectedRoute>
            <HelpSupport />
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/edit"
        element={
          <ProtectedRoute>
            <Edit />
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/custom"
        element={
          <ProtectedRoute>
            <ImageGallery />
          </ProtectedRoute>
        }
      /> */}
      {/* <Route
        path="/template"
        element={
          <ProtectedRoute>
            <ImageGallery />
          </ProtectedRoute>
        }
      /> */}
      {/* <Route path="/premium" element={<PricingPage />} /> */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />

      {/* 🧑💼 Protected Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute type="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="home" element={<AdminHome />} />
        <Route path="manage-frames" element={<ManageFrames />} />
        <Route path="manage-images" element={<ManageImages />} />
        <Route path="manage-plans" element={<AdminPlans />} />
        <Route path="logo-templates" element={<ManageLogoTemplates />} />
        <Route path="website-templates" element={<ManageWebsiteTemplates />} />
        <Route path="home-slides" element={<ManageHomeSlides />} />
        <Route path="manage-banners" element={<AdminManageBanners />} />
        <Route path="manage-calendar" element={<ManageCalendar />} />
        <Route path="design/banners" element={<AdminManageBanners />} />
        <Route path="design/logo" element={<ManageLogoTemplates />} />
        <Route path="design/website" element={<ManageWebsiteTemplates />} />
        <Route path="design/visiting-card" element={<ManageVisitingCards />} />
        <Route path="design/digital-card" element={<ManageDigitalCards />} />
        <Route path="design/templates" element={<ManageTemplates />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="design-categories" element={<DesignCategory />} />
        <Route path="notifications" element={<ManageNotifications />} />
        <Route path="blogs" element={<AdminManageBlogs />} />


        <Route
          path="manage-terms-and-conditions"
          element={<TermsAndConditionsAdmin />}
        />
        <Route path="push-notification" element={<SendPushNotification />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="user-profiles" element={<AdminUserProfiles />} />
        <Route path="user-subscription/:userId" element={<AdminSubscriptionDetails />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="contacts" element={<AdminContact />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="privacy-policy" element={<AdminPrivacyPolicy />} />
      </Route>

      {/* 🚫 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default RouteConfig;
