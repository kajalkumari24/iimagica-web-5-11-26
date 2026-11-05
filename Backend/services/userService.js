import User from "../models/User.js";
import Profile from "../models/Profile.js";
import RefreshToken from "../models/RefreshToken.js";
import Subscription from "../models/Subscription.js";
import Review from "../models/Review.js";
import Feedback from "../models/Feedback.js";
import UserAuthAuditLog from "../models/UserAuthAuditLog.js";
import Contact from "../models/Contact.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Permanently deletes a user and all their associated data from database and ImageKit.
 * @param {string} userId - The ID of the user to delete.
 * @throws {Error} - If the user is not found or remote/DB deletion fails.
 */
export const deleteUserAccount = async (userId) => {
  // 1. Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Retrieve all profiles of the user and delete their profile images from ImageKit
  const profiles = await Profile.find({ userId });
  for (const profile of profiles) {
    const imageIdentifier = profile.file || profile.cloudinary_id;
    if (imageIdentifier) {
      try {
        // console.log(`Deleting remote ImageKit asset for profile ${profile._id}: ${imageIdentifier}`);
        const destroyResult = await cloudinary.uploader.destroy(imageIdentifier);
        // console.log(`ImageKit deletion result for profile ${profile._id}:`, destroyResult);
      } catch (imageError) {
        console.error(`Failed to delete profile image from ImageKit for profile ${profile._id}:`, imageError);
        const error = new Error(`ImageKit deletion failed: ${imageError.message || imageError}`);
        error.statusCode = 502;
        throw error;
      }
    }
  }

  // 3. Cascade delete all documents associated with the user across MongoDB collections
  // console.log(`Cascade deleting database records for user ID: ${userId}`);

  // Delete profiles from DB
  await Profile.deleteMany({ userId });

  // Delete subscriptions
  await Subscription.deleteMany({ userId });

  // Delete reviews
  await Review.deleteMany({ userId });

  // Delete feedbacks
  await Feedback.deleteMany({ userId });

  // Delete contact messages created by the user
  await Contact.deleteMany({ userId });

  // Delete user authentication logs (matching by user ID, email, or phone identifier)
  // const logQueries = [{ userId }];
  // if (user.email) logQueries.push({ email: user.email });
  // if (user.phone) logQueries.push({ email: user.phone });
  // await UserAuthAuditLog.deleteMany({ $or: logQueries });

  await UserAuthAuditLog.deleteMany({ userId });

  // Delete refresh tokens
  await RefreshToken.deleteMany({ userId });

  // 4. Delete the primary User document
  await User.findByIdAndDelete(userId);
  // console.log(`Successfully deleted user account: ${userId}`);
};
