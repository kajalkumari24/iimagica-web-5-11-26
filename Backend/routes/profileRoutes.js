
// import express from "express";
// import multer from "multer";
// import streamifier from "streamifier";
// import path from "path";
// import { authMiddleware } from "../middleware/authMiddleware.js";
// import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
// import cloudinary from "../config/cloudinary.js";
// import {
//   createProfile,
//   getProfiles,
//   deleteAllProfiles,
//   getMyProfile,
//   updateMyProfile,
//   getAllMyProfiles,
//   switchActiveProfile,
// } from "../controllers/profileController.js";
// import Profile from "../models/Profile.js";

// const router = express.Router();

// const upload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter: (req, file, cb) => {
//     const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);
//     const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
//     const ext = path.extname(file.originalname || "").toLowerCase();
//     const mimeOk = allowedMime.has(file.mimetype);
//     const extOk = allowedExt.has(ext);

//     console.debug("profile/multer: incoming file", {
//       fieldname: file.fieldname,
//       originalname: file.originalname,
//       mimetype: file.mimetype,
//       ext,
//     });

//     if (mimeOk && extOk) return cb(null, true);
//     return cb(new Error("Only JPG, JPEG, PNG, and WEBP profile images are allowed"), false);
//   },
// });

// const uploadProfileImage = async (file) =>
//   new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       { folder: "profiles", resource_type: "image" },
//       (error, result) => (error ? reject(error) : resolve(result))
//     );
//     streamifier.createReadStream(file.buffer).pipe(uploadStream);
//   });

// const removeRemoteImageIfAny = async (fileUrlOrId) => {
//   if (!fileUrlOrId || typeof fileUrlOrId !== "string") return;
//   try {
//     await cloudinary.uploader.destroy(fileUrlOrId, { resource_type: "image" });
//   } catch (err) {
//     console.warn("profile image delete failed:", err?.message || err);
//   }
// };

// // ✅ Create profile (requires auth so userId is available)
// router.post("/", authMiddleware, upload.single("file"), createProfile);
// router.get("/", getProfiles);
// router.delete("/", deleteAllProfiles);

// // ✅ Count route
// router.get("/count", adminAuthMiddleware, async (req, res) => {
//   try {
//     const count = await Profile.countDocuments();
//     res.status(200).json({ success: true, data: { count } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Category-wise count
// router.get("/profiletype-counts", adminAuthMiddleware, async (req, res) => {
//   try {
//     const profiles = await Profile.find();
//     const profileTypeCounts = {};

//     profiles.forEach((profile) => {
//       const rawType = String(profile.profileType || profile.profiletype || "").trim().toLowerCase();
//       if (!rawType) return;

//       const typeName = rawType.charAt(0).toUpperCase() + rawType.slice(1);

//       profileTypeCounts[typeName] = (profileTypeCounts[typeName] || 0) + 1;
//     });

//     const defaultTypes = [
//       "Political",
//       "Business",
//       "Professional",
//       "Personal",
//       "Social",
//       "Brand",
//     ];
//     defaultTypes.forEach((type) => {
//       if (!profileTypeCounts[type]) profileTypeCounts[type] = 0;
//     });

//     res.status(200).json({ success: true, data: profileTypeCounts, counts: profileTypeCounts });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Category filter route
// router.get("/category/:category", async (req, res) => {
//   try {
//     const { category } = req.params;
//     const profiles = await Profile.find({ categories: category });
//     res.status(200).json(profiles);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Authenticated user routes (must come before :id routes)
// router.get("/me", authMiddleware, getMyProfile);
// router.get("/me/all", authMiddleware, getAllMyProfiles);
// router.patch("/me/switch/:profileId", authMiddleware, switchActiveProfile);
// router.put("/me", authMiddleware, upload.single("file"), updateMyProfile);

// // Get user's profile for admin editing
// router.get("/user/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const profile = await Profile.findOne({ userId }).populate('userId', 'email');
//     if (!profile) {
//       return res.status(404).json({ message: "Profile not found" });
//     }
//     res.json({ success: true, data: profile });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Admin update user profile
// router.put("/user/:userId", upload.single("file"), async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const profile = await Profile.findOne({ userId });
    
//     if (!profile) {
//       return res.status(404).json({ message: "Profile not found" });
//     }

//     Object.keys(req.body).forEach((key) => {
//       if (req.body[key] !== undefined) {
//         profile[key] = req.body[key];
//       }
//     });

//     if (req.file) {
//       const uploaded = await uploadProfileImage(req.file);
//       await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);
//       profile.file = uploaded.secure_url || uploaded.url;
//       profile.cloudinary_id = uploaded.public_id || profile.cloudinary_id;
//     }

//     await profile.save();
//     res.json({ success: true, message: "Profile updated successfully", data: profile });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Place before any route with `/:id`
// router.put("/remove-image", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id || req.user._id;

//     // Find active profile
//     let profile = await Profile.findOne({ userId, isActive: true });
    
//     if (!profile) {
//       profile = await Profile.findOne({ userId });
//     }

//     if (!profile) {
//       return res.status(404).json({ message: "Profile not found" });
//     }

//     await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);

//     // Remove file reference in DB
//     profile.file = null;
//     profile.cloudinary_id = null;
//     await profile.save();

//     res.status(200).json({
//       success: true,
//       message: "Profile image removed successfully",
//       profile,
//     });
//   } catch (error) {
//     console.error("Error removing image:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while removing image", error: error.message });
//   }
// });


// // ✅ Admin routes by ID
// router.put("/:id", upload.single("file"), async (req, res) => {
//   try {
//     const { id } = req.params;

//     const profile = await Profile.findById(id);
//     if (!profile) return res.status(404).json({ message: "Profile not found" });

//     Object.keys(req.body).forEach((key) => {
//       profile[key] = req.body[key];
//     });

//     if (req.file) {
//       const uploaded = await uploadProfileImage(req.file);
//       await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);
//       profile.file = uploaded.secure_url || uploaded.url;
//       profile.cloudinary_id = uploaded.public_id || profile.cloudinary_id;
//     }

//     await profile.save();
//     res.status(200).json({ message: "Profile updated successfully", profile });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Delete profile by ID
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const profile = await Profile.findById(id);
//     if (!profile) return res.status(404).json({ message: "Profile not found" });

//     await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);

//     await Profile.findByIdAndDelete(id);
//     res.status(200).json({ message: "Profile deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ✅ Filter profiles by type
// router.get("/type/:profiletype", async (req, res) => {
//   try {
//     const { profiletype } = req.params;
//     const profiles = await Profile.find({ profiletype });
//     res.json(profiles);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching profiles by type" });
//   }
// });

// export default router;


import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import path from "path";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import cloudinary from "../config/cloudinary.js";
import {
  createProfile,
  getProfiles,
  deleteAllProfiles,
  getMyProfile,
  updateMyProfile,
  getAllMyProfiles,
  switchActiveProfile,
} from "../controllers/profileController.js";
import Profile from "../models/Profile.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    const allowedMime = new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/octet-stream",
    ]);
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mimeOk = allowedMime.has(file.mimetype);
    const extOk = allowedExt.has(ext);

    // console.debug("profile/multer: incoming file", {
    //   fieldname: file.fieldname,
    //   originalname: file.originalname,
    //   mimetype: file.mimetype,
    //   ext,
    // });

    if (extOk || mimeOk) return cb(null, true);
    return cb(new Error("Only JPG, JPEG, PNG, and WEBP profile images are allowed"), false);
  },
});

const uploadProfileImage = async (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "profiles", resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const removeRemoteImageIfAny = async (fileUrlOrId) => {
  if (!fileUrlOrId || typeof fileUrlOrId !== "string") return;
  try {
    await cloudinary.uploader.destroy(fileUrlOrId, { resource_type: "image" });
  } catch (err) {
    console.warn("profile image delete failed:", err?.message || err);
  }
};

// ✅ Create profile (requires auth so userId is available)
router.post("/", authMiddleware, upload.single("file"), createProfile);
router.get("/", getProfiles);
router.delete("/", deleteAllProfiles);

// ✅ Count route
router.get("/count", adminAuthMiddleware, async (req, res) => {
  try {
    const count = await Profile.countDocuments();
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Category-wise count
router.get("/profiletype-counts", adminAuthMiddleware, async (req, res) => {
  try {
    const profiles = await Profile.find();
    const profileTypeCounts = {};

    profiles.forEach((profile) => {
      const rawType = String(profile.profileType || profile.profiletype || "").trim().toLowerCase();
      if (!rawType) return;

      const typeName = rawType.charAt(0).toUpperCase() + rawType.slice(1);

      profileTypeCounts[typeName] = (profileTypeCounts[typeName] || 0) + 1;
    });

    const defaultTypes = [
      "Political",
      "Business",
      "Professional",
      "Personal",
      "Social",
      "Brand",
    ];
    defaultTypes.forEach((type) => {
      if (!profileTypeCounts[type]) profileTypeCounts[type] = 0;
    });

    res.status(200).json({ success: true, data: profileTypeCounts, counts: profileTypeCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Category filter route
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const profiles = await Profile.find({ categories: category });
    res.status(200).json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Authenticated user routes (must come before :id routes)
router.get("/me", authMiddleware, getMyProfile);
router.get("/me/all", authMiddleware, getAllMyProfiles);
router.patch("/me/switch/:profileId", authMiddleware, switchActiveProfile);
router.put("/me", authMiddleware, upload.single("file"), updateMyProfile);

// Get user's profile for admin editing
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId }).populate('userId', 'email');
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin update user profile
router.put("/user/:userId", upload.single("file"), async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        profile[key] = req.body[key];
      }
    });

    if (req.file) {
      const uploaded = await uploadProfileImage(req.file);
      await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);
      profile.file = uploaded.secure_url || uploaded.url;
      profile.cloudinary_id = uploaded.public_id || profile.cloudinary_id;
    }

    await profile.save();
    res.json({ success: true, message: "Profile updated successfully", data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Place before any route with `/:id`
router.put("/remove-image", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Find active profile
    let profile = await Profile.findOne({ userId, isActive: true });

    if (!profile) {
      profile = await Profile.findOne({ userId });
    }

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);

    // Remove file reference in DB
    profile.file = null;
    profile.cloudinary_id = null;
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
      profile,
    });
  } catch (error) {
    console.error("Error removing image:", error);
    res
      .status(500)
      .json({ message: "Server error while removing image", error: error.message });
  }
});


// ✅ Admin routes by ID
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    Object.keys(req.body).forEach((key) => {
      profile[key] = req.body[key];
    });

    if (req.file) {
      const uploaded = await uploadProfileImage(req.file);
      await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);
      profile.file = uploaded.secure_url || uploaded.url;
      profile.cloudinary_id = uploaded.public_id || profile.cloudinary_id;
    }

    await profile.save();
    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete profile by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    await removeRemoteImageIfAny(profile.file || profile.cloudinary_id);

    await Profile.findByIdAndDelete(id);
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Filter profiles by type
router.get("/type/:profiletype", async (req, res) => {
  try {
    const { profiletype } = req.params;
    const profiles = await Profile.find({ profiletype });
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profiles by type" });
  }
});

export default router;