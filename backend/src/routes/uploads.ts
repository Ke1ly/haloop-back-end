import express, { Request, Response } from "express";
import multer from "multer";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

router.post(
  "/",
  upload.array("images"),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return void res.status(400).json({ error: "No files uploaded" });
    }
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const key = `uploads/${uuidv4()}-${file.originalname}`;
          await s3
            .putObject({
              Bucket: process.env.S3_BUCKET!,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
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
