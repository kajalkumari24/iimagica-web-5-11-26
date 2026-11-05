import ProfileType from "../models/ProfileType.js";
import Frame from "../models/Frame.js";

const slugify = (text) => String(text || "").toLowerCase().trim().replace(/\s+/g, "-");


// ➤ Get by type (User dropdown ke liye)
export const getProfileTypes = async (req, res) => {
  try {
    const { type } = req.params;
    const data = await ProfileType.find({ type }).sort({ name: 1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
};


// ➤ Add (Admin)
export const addProfileType = async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) return res.status(400).json({ message: "Type and name required" });

    const exists = await ProfileType.findOne({ type, name });
    if (exists) return res.status(400).json({ message: "Already exists" });

    const newItem = new ProfileType({ type, name });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ message: "Error adding data" });
  }
};


// ➤ Update (Admin) — also syncs related frame categories
export const updateProfileType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Name required" });

    // Fetch existing to get old name before update
    const existing = await ProfileType.findById(id);
    if (!existing) return res.status(404).json({ message: "Not found" });

    const oldName = existing.name;
    const type = existing.type;

    const updated = await ProfileType.findByIdAndUpdate(id, { name }, { new: true });

    // Sync frames only for types that use slug-based categories
    const syncTypes = ["political", "professional", "brand"];

    if (syncTypes.includes(type)) {
      const oldSlug = `${type}-${slugify(oldName)}`;
      const newSlug = `${type}-${slugify(name)}`;

      const result = await Frame.updateMany(
        { category: oldSlug },
        { $set: { category: newSlug } }
      );

      if (global.io) {
        global.io.emit("profileTypeUpdated", { type, oldSlug, newSlug });
      }

      return res.status(200).json({
        success: true,
        data: updated,
        framesUpdated: result.modifiedCount,
        oldSlug,
        newSlug,
      });
    }

    if (global.io) {
      global.io.emit("profileTypeUpdated", { type, name });
    }
    res.status(200).json({ success: true, data: updated, framesUpdated: 0 });
  } catch (error) {
    res.status(500).json({ message: "Error updating" });
  }
};


// ➤ Delete (Admin)
export const deleteProfileType = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ProfileType.findById(id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    await ProfileType.findByIdAndDelete(id);
    if (global.io) {
      global.io.emit('profileTypeUpdated', { type: existing.type, action: 'deleted', name: existing.name });
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting" });
  }
};