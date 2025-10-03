import { RawWorkPost, formattedWorkPost } from "../types/Work.js";

export function formatWorkPost(post: RawWorkPost): formattedWorkPost {
  return {
    ...post,
    images: (post.images ?? []).map((img: any) => img.imageUrl),
    positionCategories: (post.positionCategories ?? []).map(
      (cat: any) => cat.name
    ),
    accommodations: (post.accommodations ?? []).map((acc: any) => acc.name),
    requirements: (post.requirements ?? []).map((req: any) => req.name),
    meals: (post.meals ?? []).map((meal: any) => meal.name),
    experiences: (post.experiences ?? []).map((exp: any) => exp.name),
    environments: (post.environments ?? []).map((env: any) => env.name),
  };
}
