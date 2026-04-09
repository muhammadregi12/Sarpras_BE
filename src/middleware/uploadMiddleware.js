const multer = require("multer");
const path = require("path");
const fs = require("fs");

const imageMiddleware = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join("public", "upload", folderName);

      // Buat folder otomatis jika belum ada
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${folderName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });

  // Filter hanya file gambar yang diizinkan
  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Format file tidak didukung. Gunakan: JPG, PNG, WEBP, atau GIF`), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, // Maksimal 2MB
    },
  });
};

module.exports = imageMiddleware;