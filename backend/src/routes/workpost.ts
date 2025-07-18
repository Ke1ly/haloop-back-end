import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();

router.get("/:id", async (req: Request, res: Response) => {
  const workpostId = req.params.id;
  if (!workpostId) return void res.status(400).json({ error: "Invalid ID" });

  try {
    const workPost = await prisma.workPost.findUnique({
      where: { id: workpostId },
      include: {
        unit: true,
        images: true,
        positionCategories: true,
        requirements: true,
        accommodations: true,
        meals: true,
        experiences: true,
        environments: true,
      },
    });

    if (!workPost)
      return void res.status(404).json({ error: "Work not found" });
    let formattedWorkPost = formatWorkPost(workPost);
    res.json(formattedWorkPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatWorkPost(post: any) {
  return {
    ...post,
    images: (post.images ?? []).map((img: any) => img.imageUrl),
    positionCategories: (post.positionCategories ?? []).map(
      (cat: any) => cat.name
    ),
    accommodations: (post.accommodations ?? []).map((acc: any) => acc.name),
    meals: (post.meals ?? []).map((meal: any) => meal.name),
    experiences: (post.experiences ?? []).map((exp: any) => exp.name),
    environments: (post.environments ?? []).map((env: any) => env.name),
    requirements: (post.requirements ?? []).map((req: any) => req.name),
  };
}

router.get("/availability/:workPostId", async (req, res) => {
  const { workPostId } = req.params;
  const { startDate, endDate } = req.query;

  const availableDates = await prisma.availability.findMany({
    where: {
      workPostId,
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
      remainingRecruitCount: {
        gt: 0,
      },
    },
    select: {
      date: true,
      remainingRecruitCount: true,
    },
  });

  res.json(availableDates);
});

export default router;
