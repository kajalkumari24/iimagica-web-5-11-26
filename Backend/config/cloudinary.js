import fs from "fs";
import path from "path";
import { PassThrough } from "stream";
import imagekit from "./imagekit.js";

const DEFAULT_EXT = "png";
const MAX_FILE_NAME_LENGTH = 180;
const IMAGEKIT_URL_ENDPOINT = (process.env.IMAGEKIT_URL_ENDPOINT || "").replace(/\/$/, "");

const toPublicIdFromPath = (filePath = "") =>
  String(filePath || "")
    .replace(/^\/+/, "")
    .replace(/\.[a-zA-Z0-9]+$/, "");

const normalizeFolder = (folder = "") => {
  if (!folder) return "/";
  const withLeading = String(folder).startsWith("/") ? String(folder) : `/${folder}`;
  return withLeading.replace(/\/+$/, "");
};

const sanitizeName = (name = "file") => String(name || "file")
  .replace(/[^a-zA-Z0-9._-]/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-+|-+$/g, "");

const normalizeFileName = (name = "", extHint = DEFAULT_EXT) => {
  const fallbackExt = String(extHint || DEFAULT_EXT).replace(/^\./, "").toLowerCase() || DEFAULT_EXT;
  const sanitized = sanitizeName(name || "") || `upload-${Date.now()}.${fallbackExt}`;

  let base = sanitized;
  let ext = "";
  const dot = sanitized.lastIndexOf(".");
  if (dot > 0 && dot < sanitized.length - 1) {
    base = sanitized.slice(0, dot);
    ext = sanitized.slice(dot + 1);
  }
  if (!ext) ext = fallbackExt;

  const maxBaseLength = Math.max(20, MAX_FILE_NAME_LENGTH - ext.length - 1);
  const trimmedBase = (base || `upload-${Date.now()}`).slice(0, maxBaseLength);
  return `${trimmedBase}.${ext}`;
};

const mimeFromExtension = (ext = "", resourceType = "image") => {
  const clean = String(ext || "").replace(/^\./, "").toLowerCase();
  const map = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    avif: "image/avif",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
  };
  if (map[clean]) return map[clean];
  return resourceType === "video" ? "video/mp4" : "image/png";
};

const toDataUriFromBuffer = (buffer, { fileName = "", format = "", resource_type = "image" } = {}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return "";
  const extFromFile = path.extname(String(fileName || "")).replace(/^\./, "").toLowerCase();
  const ext = extFromFile || String(format || "").toLowerCase() || (resource_type === "video" ? "mp4" : "png");
  const mime = mimeFromExtension(ext, resource_type);
  return `data:${mime};base64,${buffer.toString("base64")}`;
};

const resolveUploadInput = (file, options = {}) => {
  if (Buffer.isBuffer(file)) {
    if (!file.length) throw new Error("Upload buffer is empty");
    return { file: toDataUriFromBuffer(file, options) };
  }

  if (typeof file === "string") {
    if (/^https?:\/\//i.test(file)) return { file };

    if (fs.existsSync(file)) {
      const buff = fs.readFileSync(file);
      if (!buff.length) throw new Error("Upload file is empty");
      return {
        file: toDataUriFromBuffer(buff, {
          ...options,
          fileName: options.fileName || path.basename(file),
        }),
      };
    }

    return { file };
  }

  throw new Error("Unsupported upload file input");
};

const guessFileName = ({ file, publicId, folder, format }) => {
  if (Buffer.isBuffer(file)) {
    const ext = (format || "").trim().replace(/^\./, "") || DEFAULT_EXT;
    return normalizeFileName(`upload-${Date.now()}.${ext}`, ext);
  }

  const ext = (format || "").trim() || path.extname(String(file || "")).replace(/^\./, "") || DEFAULT_EXT;

  if (publicId) {
    const maybeName = sanitizeName(String(publicId).split("/").pop() || `upload-${Date.now()}`);
    return normalizeFileName(maybeName.includes(".") ? maybeName : `${maybeName}.${ext}`, ext);
  }

  const fromPath = sanitizeName(path.basename(String(file || "")) || "");
  if (fromPath && fromPath.includes(".")) return normalizeFileName(fromPath, ext);

  const folderName = sanitizeName(String(folder || "").split("/").pop() || "upload");
  return normalizeFileName(`${folderName}-${Date.now()}.${ext}`, ext);
};

const findImageKitFile = async (publicIdOrUrl) => {
  const raw = String(publicIdOrUrl || "").trim();
  if (!raw) return null;

  let folderHint = "";
  let lastSegment = raw;

  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      const pathParts = u.pathname.split("/").filter(Boolean);
      lastSegment = pathParts[pathParts.length - 1] || "";
      folderHint = pathParts.slice(0, -1).join("/");
    } else {
      const parts = raw.replace(/^\/+/, "").split("/");
      lastSegment = parts[parts.length - 1] || "";
      folderHint = parts.slice(0, -1).join("/");
    }
  } catch {
    // fallback remains
  }

  const base = lastSegment.replace(/\.[a-zA-Z0-9]+$/, "");
  const hasExt = /\.[a-zA-Z0-9]+$/.test(lastSegment);
  const names = hasExt
    ? [lastSegment]
    : [`${base}.png`, `${base}.jpg`, `${base}.jpeg`, `${base}.webp`, `${base}.gif`, `${base}.avif`];

  for (const name of names) {
    try {
      const files = await imagekit.assets.list({
        searchQuery: `name = \"${name}\"`,
        limit: 20,
        type: "file",
      });
      if (!Array.isArray(files) || !files.length) continue;

      if (!folderHint) return files[0];

      const matched = files.find((f) => String(f.filePath || "").includes(folderHint));
      if (matched) return matched;
      return files[0];
    } catch {
      // try next name
    }
  }

  return null;
};

const uploader = {
  upload: async (file, options = {}) => {
    const folder = normalizeFolder(options.folder || "");
    const publicId = options.public_id || "";
    const extHint =
      (options.format || "").trim().replace(/^\./, "").toLowerCase() ||
      path.extname(String(options.fileName || options.original_filename || "")).replace(/^\./, "").toLowerCase() ||
      DEFAULT_EXT;
    const requestedName = options.fileName || options.original_filename || "";
    const guessed = guessFileName({ file, publicId, folder, format: extHint });
    const fileName = normalizeFileName(requestedName || guessed, extHint);

    const input = resolveUploadInput(file, { ...options, fileName });

    const result = await imagekit.files.upload({
      ...input,
      fileName,
      folder,
      useUniqueFileName: typeof options.useUniqueFileName === "boolean" ? options.useUniqueFileName : true,
    });

    return {
      secure_url: result.url,
      url: result.url,
      path: result.url,
      public_id: toPublicIdFromPath(result.filePath || `${folder}/${fileName}`),
      fileId: result.fileId,
      filePath: result.filePath,
      name: result.name,
    };
  },

  upload_stream: (options = {}, callback) => {
    const done = typeof callback === "function" ? callback : () => {};
    const pass = new PassThrough();
    const chunks = [];

    pass.on("data", (chunk) => {
      chunks.push(chunk);
    });

    pass.on("error", (err) => {
      done(err);
    });

    pass.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        if (!buffer.length) {
          return done(new Error("Empty file buffer"));
        }

        const result = await uploader.upload(buffer, options);
        done(null, result);
      } catch (err) {
        done(err);
      }
    });

    return pass;
  },

  destroy: async (publicIdOrUrl) => {
    const file = await findImageKitFile(publicIdOrUrl);
    if (!file?.fileId) return { result: "not found" };
    await imagekit.files.delete(file.fileId);
    return { result: "ok" };
  },
};

const api = {
  resource: async (publicIdOrUrl) => {
    const file = await findImageKitFile(publicIdOrUrl);
    if (!file) {
      const err = new Error("Resource not found");
      err.http_code = 404;
      throw err;
    }

    return {
      secure_url: file.url,
      url: file.url,
      public_id: toPublicIdFromPath(file.filePath || file.name),
    };
  },
};

const cloudinaryCompat = {
  uploader,
  api,
  config: () => {},
  url: ({ public_id } = {}) => {
    if (!public_id) return "";
    if (String(public_id).startsWith("http")) return String(public_id);
    if (!IMAGEKIT_URL_ENDPOINT) return String(public_id);
    return `${IMAGEKIT_URL_ENDPOINT}/${String(public_id).replace(/^\/+/, "")}`;
  },
};

export default cloudinaryCompat;
