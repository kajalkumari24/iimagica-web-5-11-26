
import multer from "multer";

// ✅ Use memory storage (no local saving)
const storage = multer.memoryStorage();

// ✅ File validation
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = file.originalname.toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const uploadFrame = multer({ storage, fileFilter });
export default uploadFrame;


