import Review from "../models/Review.js";
import Profile from "../models/Profile.js";

// ── USER: Submit or update own review ─────────────────────────────────────────
export const submitReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const review = await Review.findOneAndUpdate(
      { userId },
      { rating, comment: comment || "", isVisible: false }, // reset visibility on edit
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Review submitted", data: review });
  } catch (err) {
    console.error("submitReview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── USER: Get own review ───────────────────────────────────────────────────────
export const getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({ userId: req.user._id });
    res.json({ success: true, data: review || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUBLIC: Get only visible reviews (for landing/homepage display) ───────────
export const getVisibleReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isVisible: true })
      .populate("userId", "name")
      .sort({ updatedAt: -1 })
      .lean(); // .lean() allows us to modify the Mongoose documents

    // Look up the user's uploaded profile picture from the Profile collection
    for (let review of reviews) {
      if (review.userId && review.userId._id) {
        const profile = await Profile.findOne({ userId: review.userId._id }).select("file");
        if (profile && profile.file) {
          review.userId.file = profile.file;
        }
      }
    }

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("getVisibleReviews error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: Get all reviews ─────────────────────────────────────────────────────
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Look up the user's uploaded profile picture from the Profile collection
    for (let review of reviews) {
      if (review.userId && review.userId._id) {
        const profile = await Profile.findOne({ userId: review.userId._id }).select("file");
        if (profile && profile.file) {
          review.userId.file = profile.file;
        }
      }
    }

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("getAllReviews error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: Toggle isVisible for a review ──────────────────────────────────────
export const toggleReviewVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.isVisible = !review.isVisible;
    await review.save();

    if (global.io) global.io.emit("reviewUpdated");

    res.json({ success: true, message: `Review ${review.isVisible ? "shown" : "hidden"}`, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── ADMIN: Delete a review ─────────────────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    
    if (global.io) global.io.emit("reviewUpdated");

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
