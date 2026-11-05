import PrivacyPolicy from "../models/PrivacyPolicy.js";
import { apiResponse } from "../utils/apiResponse.js";

// Get the privacy policy
export const getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne().sort({ updatedAt: -1 });

    if (!policy) {
      return apiResponse(res, 200, "Privacy Policy has not been set yet.", null);
    }

    return apiResponse(
      res,
      200,
      "Privacy Policy fetched successfully.",
      policy
    );
  } catch (error) {
    return apiResponse(res, 500, "Server error", {
      error: error.message,
    });
  }
};

// Create or update the privacy policy (Admin only)
export const createOrUpdatePrivacyPolicy = async (req, res) => {
  const { content } = req.body;
  const trimmedContent = typeof content === "string" ? content.trim() : "";

  if (!trimmedContent) {
    return apiResponse(res, 400, "Content is required.");
  }

  try {
    let policy = await PrivacyPolicy.findOne().sort({ updatedAt: -1 });

    if (policy) {
      policy.content = trimmedContent;
    } else {
      policy = new PrivacyPolicy({ content: trimmedContent });
    }

    await policy.save();

    return apiResponse(
      res,
      200,
      "Privacy Policy updated successfully.",
      policy
    );
  } catch (error) {
    return apiResponse(res, 500, "Server error", {
      error: error.message,
    });
  }
};
