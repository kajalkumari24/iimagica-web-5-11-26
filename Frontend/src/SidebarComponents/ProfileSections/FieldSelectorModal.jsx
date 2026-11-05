import React, { useState, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";

const FieldSelectorModal = ({
  isOpen,
  profileType,
  initialSelectedFields = [],
  onClose,
  onConfirm
}) => {
  const [selected, setSelected] = useState({
    personalPrimary: [],
    personalDetails: [],
    contact: [],
    social: [],
  });

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const limits = {
    personalPrimary: 1,
    personalDetails: 1,
    contact: 1,
    social: 2,
  };

  const sortSectionSelection = (section, selectedKeys) => {
    if (section !== "personalPrimary") return selectedKeys;

    // Keep name/businessName pinned to priority order
    const priority = ["name", "businessName"];
    const unique = [...new Set(selectedKeys)];
    const prioritized = priority.filter((k) => unique.includes(k));
    const rest = unique.filter((k) => !priority.includes(k));
    return [...prioritized, ...rest];
  };

  const getPrimaryPersonalOptions = () => {
    const normalizedType = String(profileType || "").toLowerCase();

    if (normalizedType === "personal") {
      return [{ key: "name", label: "Name" }];
    }
    if (normalizedType === "professional") {
      return [
        { key: "name", label: "Name" },
        { key: "businessName", label: "Business Name" },
      ];
    }
    if (normalizedType === "social") {
      return [{ key: "name", label: "Name" }];
    }
    if (normalizedType === "brand") {
      return [{ key: "name", label: "Name" }];
    }
    // business, default
    return [
      { key: "name", label: "Name" },
      { key: "businessName", label: "Business Name" },
    ];
  };

  const getDetailPersonalOptions = () => {
    const normalizedType = String(profileType || "").toLowerCase();

    if (normalizedType === "personal") {
      return [
        { key: "bio", label: "Bio" },
        { key: "website", label: "Website" },
      ];
    }
    if (normalizedType === "professional") {
      return [
        { key: "designation", label: "Designation" },
        { key: "website", label: "Website" },
      ];
    }
    if (normalizedType === "business") {
      return [
        { key: "designation", label: "Designation" },
        { key: "website", label: "Website" },
      ];
    }
    if (normalizedType === "brand") {
      return [
        { key: "designation", label: "Designation" },
        { key: "website", label: "Website" },
      ];
    }
    if (normalizedType === "social") {
      return [
        { key: "designation", label: "Designation" },
        { key: "website", label: "Website" },
      ];
    }
    return [
      { key: "designation", label: "Designation" },
      { key: "website", label: "Website" },
    ];
  };

  const getDetailsSectionTitle = () => {
    const normalizedType = String(profileType || "").toLowerCase();
    if (normalizedType === "personal") return "Bio / Website";
    return "Designation / Website";
  };

  const optionsMap = {
    personalPrimary: getPrimaryPersonalOptions(),
    personalDetails: getDetailPersonalOptions(),
    contact: [
      { key: "email", label: "Email" },
      { key: "mobile", label: "Mobile" },
      { key: "fax", label: "Fax" },
    ],
    social: [
      { key: "social_instagram", label: "Instagram" },
      { key: "social_facebook", label: "Facebook" },
      { key: "social_linkedin", label: "LinkedIn" },
      { key: "social_twitter", label: "Twitter" },
      { key: "social_snapchat", label: "Snapchat" },
      { key: "social_youtube", label: "YouTube" },
      { key: "social_telegram", label: "Telegram" },
      { key: "social_discord", label: "Discord" },
    ],
  };

  const normalizeFieldKey = (value) => {
    const lowered = String(value || "").toLowerCase();
    if (lowered === "contact") return "mobile";
    return value;
  };

  useEffect(() => {
    if (!isOpen) return;

    const primaryOptions = getPrimaryPersonalOptions();
    const detailOptions = getDetailPersonalOptions();
    const contactOptions = optionsMap.contact;
    const socialOptions = optionsMap.social;

    const personalPrimaryKeys = new Set(primaryOptions.map((o) => o.key));
    const personalDetailsKeys = new Set(detailOptions.map((o) => o.key));
    const contactKeys = new Set(contactOptions.map((o) => o.key));
    const socialKeys = new Set(socialOptions.map((o) => o.key));

    const next = { personalPrimary: [], personalDetails: [], contact: [], social: [] };
    const initial = Array.isArray(initialSelectedFields) ? initialSelectedFields : [];

    initial.forEach((rawKey) => {
      const key = normalizeFieldKey(rawKey);
      if (personalPrimaryKeys.has(key) && next.personalPrimary.length < limits.personalPrimary) {
        next.personalPrimary.push(key);
      } else if (personalDetailsKeys.has(key) && next.personalDetails.length < limits.personalDetails) {
        next.personalDetails.push(key);
      } else if (contactKeys.has(key) && next.contact.length < limits.contact) {
        next.contact.push(key);
      } else if (socialKeys.has(key) && next.social.length < limits.social) {
        next.social.push(key);
      }
    });

    next.personalPrimary = sortSectionSelection("personalPrimary", next.personalPrimary);
    next.personalDetails = sortSectionSelection("personalDetails", next.personalDetails);
    setSelected(next);
  }, [isOpen, profileType, JSON.stringify(initialSelectedFields)]);

  if (!isOpen) return null;

  const toggle = (section, key) => {
    setSelected((prev) => {
      const current = prev[section];
      if (current.includes(key)) {
        return {
          ...prev,
          [section]: sortSectionSelection(section, current.filter((x) => x !== key)),
        };
      }
      if (current.length < limits[section]) {
        return {
          ...prev,
          [section]: sortSectionSelection(section, [...current, key]),
        };
      }
      return prev;
    });
  };

  const totalSelected =
    selected.personalPrimary.length +
    selected.personalDetails.length +
    selected.contact.length +
    selected.social.length;

  const handleConfirm = () => {
    const finalData = [
      ...selected.personalPrimary,
      ...selected.personalDetails,
      ...selected.contact,
      ...selected.social,
    ];
    onConfirm(finalData);
  };

  const renderSection = (title, sectionKey) => (
    <div className="mb-8">
      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center justify-between">
        {title}
        <span className="text-xs font-normal text-slate-400">
          ({selected[sectionKey].length}/{limits[sectionKey]})
        </span>
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {optionsMap[sectionKey].map((opt) => {
          const isChecked = selected[sectionKey].includes(opt.key);
          const isDisabled = selected[sectionKey].length >= limits[sectionKey] && !isChecked;

            return (
            <label
              key={opt.key}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                ${isChecked
                  ? "border-[#F55E3C] bg-[#F55E3C]/10 cursor-pointer"
                  : isDisabled
                    ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                    : "border-slate-200 hover:border-slate-300 bg-white cursor-pointer"}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => toggle(sectionKey, opt.key)}
                className="w-4 h-4 accent-[#F55E3C] disabled:opacity-50"
              />
              <span className="text-sm text-slate-700 font-medium">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="hidden md:flex fixed inset-0 bg-black/60 backdrop-blur-sm z-50 items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col mt-16" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800">Select Fields to Show</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          <p className="text-sm text-slate-500 mb-5">
            Total selected: <span className="font-semibold text-[#F55E3C]">{totalSelected}/5</span>
          </p>

          {renderSection("Name / Business Name", "personalPrimary")}
          {renderSection(getDetailsSectionTitle(), "personalDetails")}
          {renderSection("Contact Info", "contact")}
          {renderSection("Social Media", "social")}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 cursor-pointer text-slate-600 font-medium border border-slate-300 rounded-2xl hover:bg-slate-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={totalSelected !== 5}
            className={`flex-1 py-3 cursor-pointer font-semibold rounded-2xl transition-all text-sm
              ${totalSelected === 5
                ? "bg-[#FF803C] hover:bg-[#FF9559] text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldSelectorModal;
