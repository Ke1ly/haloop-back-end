import express, { Request, Response } from "express";
import multer from "multer";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
const router = express.Router();

// 檔案格式過濾，只允許圖片類型
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only JPG, PNG, and WEBP allowed"));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
});

router.post(
  "/",
  upload.array("images"),
  async (req: Request, res: Response) => {
    let s3: any;
    if (process.env.NODE_ENV === "production") {
      s3 = new AWS.S3({
        region: process.env.AWS_REGION,
      });
    } else {
      s3 = new AWS.S3({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY!,
          secretAccessKey: process.env.AWS_SECRET_KEY!,
        },
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return void res.status(400).json({ error: "No files uploaded" });
    }
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80 }) // 壓縮為 JPEG 格式，80% 品質
            .toBuffer();
          const key = `uploads/${uuidv4()}-${file.originalname.replace(
            /\s+/g,
            "-"
          )}`;
          await s3
            .putObject({
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: key,
              Body: compressedBuffer,
              ContentType: "image/jpeg",
            })
            .promise();
          return `${process.env.CLOUDFRONT_URL}/${key}`;
        })
      );
      res.json({ urls });
    } catch (error) {
      console.error("S3 Upload Error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
