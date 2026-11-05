// controllers/feedbackController.js
import Feedback from "../models/Feedback.js";

export const checkFeedbackStatus = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ JWT se aayega
    const feedback = await Feedback.findOne({ userId });

    if (feedback) {
      return res.json({ hasFeedback: true });
    } else {
      return res.json({ hasFeedback: false });
    }
  } catch (err) {
    console.error("Check feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    const userId = req.user.id; // ✅ JWT se aayega

    if (!feedback) {
      return res.status(400).json({ message: "Feedback required" });
    }

    // agar pehle se diya hai toh dobara na save ho
    const already = await Feedback.findOne({ userId });
    if (already) {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    await Feedback.create({ userId, feedback });
    res.json({ message: "Thanks for your feedback!" });
  } catch (err) {
    console.error("Add feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ---------------- Fetch All Feedbacks (Admin only) ----------------
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("userId", "name email") // show user info with feedback
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { feedbacks }, feedbacks });
  } catch (err) {
    console.error("Get all feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFeedbackCount = async (req, res) => {
  try {
    const count = await Feedback.countDocuments();
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error("Feedback count error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- Delete Feedback ----------------
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    console.error("Delete feedback error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
