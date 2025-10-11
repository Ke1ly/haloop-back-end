import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();

//types
import { RawWorkPost, formattedWorkPost } from "../types/Work.js";

//services&utils
import { formatWorkPost } from "../utils/formatWorkPost.js";

//models
import { FindUniqueWorkPost } from "../models/PostModel.js";

router.get("/", async (req: Request, res: Response) => {
  const workpostId = req.query.id as string;

  if (!workpostId) return void res.status(400).json({ error: "Invalid ID" });

  try {
    const workPost: RawWorkPost | null = await FindUniqueWorkPost(workpostId);

    if (!workPost)
      return void res.status(404).json({ error: "Work not found" });
    let formattedWorkPost: formattedWorkPost = formatWorkPost(workPost);
    res.json(formattedWorkPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
