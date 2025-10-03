import prisma from "../config/database.js";
import express, { Request, Response } from "express";
const router = express.Router();

//types
import { RawWorkPost, formattedWorkPost } from "../types/Work.js";
//services&utils
import { formatWorkPost } from "../utils/formatWorkPost.js";

router.get("/", async (req: Request, res: Response) => {
  const workpostId = req.query.id as string;

  if (!workpostId) return void res.status(400).json({ error: "Invalid ID" });

  try {
    const workPost: RawWorkPost | null = await prisma.workPost.findUnique({
      where: { id: workpostId },
      select: {
        id: true,
        positionName: true,
        averageWorkHours: true,
        minDuration: true,
        recruitCount: true,
        requirements: { select: { name: true } },
        positionDescription: true,
        benefitsDescription: true,
        endDate: true,
        startDate: true,
        positionCategories: { select: { name: true } },
        meals: { select: { name: true } },
        experiences: { select: { name: true } },
        environments: { select: { name: true } },
        accommodations: { select: { name: true } },
        images: {
          select: {
            imageUrl: true,
          },
        },
        unit: {
          select: {
            id: true,
            userId: true,
            city: true,
            address: true,
            unitName: true,
            latitude: true,
            longitude: true,
            unitDescription: true,
            user: {
              select: {
                lastLoginAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!workPost)
      return void res.status(404).json({ error: "Work not found" });
    let formattedWorkPost: formattedWorkPost = formatWorkPost(workPost);
    res.json(formattedWorkPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// function formatWorkPost(post: any) {
//   return {
//     ...post,
//     images: (post.images ?? []).map((img: any) => img.imageUrl),
//     positionCategories: (post.positionCategories ?? []).map(
//       (cat: any) => cat.name
//     ),
//     accommodations: (post.accommodations ?? []).map((acc: any) => acc.name),
//     meals: (post.meals ?? []).map((meal: any) => meal.name),
//     experiences: (post.experiences ?? []).map((exp: any) => exp.name),
//     environments: (post.environments ?? []).map((env: any) => env.name),
//     requirements: (post.requirements ?? []).map((req: any) => req.name),
//   };
// }

export default router;
