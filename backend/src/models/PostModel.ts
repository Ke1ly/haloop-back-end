import prisma from "../config/database.js";
import { AppError } from "../utils/Error.js";
import { RawWorkPost } from "../types/Work.js";
import { MatchedWorkPost } from "../types/Subscription.js";

export async function CreateWorkPost(
  unitId: string,
  startDate: string,
  endDate: string,
  recruitCount: number,
  images: string[], // 假設 images 是 string[]
  positionName: string,
  positionCategories: string[],
  averageWorkHours: number,
  minDuration: number,
  requirements: string[],
  positionDescription: string,
  accommodations: string[],
  meals: string[],
  experiences: string[],
  environments: string[],
  benefitsDescription: string
): Promise<RawWorkPost> {
  const newWorkPost = await prisma.$transaction(async (tx) => {
    const modelMap = {
      positionCategory: tx.positionCategory,
      meal: tx.meal,
      requirement: tx.requirement,
      experience: tx.experience,
      environment: tx.environment,
      accommodation: tx.accommodation,
    } as const;
    type ModelMap = typeof modelMap;
    type ModelName = keyof ModelMap;

    async function upsertNames(modelName: ModelName, inputNames: string[]) {
      if (!inputNames || inputNames.length === 0) return;

      const model = modelMap[modelName] as {
        findMany: (args?: any) => Promise<any>;
        createMany: (args?: any) => Promise<any>;
      };
      const existing = await model.findMany({
        where: { name: { in: inputNames } },
        select: { name: true } as const,
      });
      const existingNames = new Set(
        existing.map((e: { name: string }) => e.name)
      );
      const toCreate = inputNames.filter((name) => !existingNames.has(name));
      if (toCreate.length > 0) {
        await model.createMany({
          data: toCreate.map((name) => ({ name })),
          skipDuplicates: true,
        });
      }
    }
    await Promise.all([
      upsertNames("positionCategory", positionCategories),
      upsertNames("meal", meals),
      upsertNames("requirement", requirements),
      upsertNames("experience", experiences),
      upsertNames("environment", environments),
      upsertNames("accommodation", accommodations),
    ]);

    const createdWorkPost: RawWorkPost = await tx.workPost.create({
      data: {
        unitId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        recruitCount,
        positionName,
        positionCategories: {
          connect: positionCategories?.map((name: string) => ({ name })) || [],
        },
        averageWorkHours,
        minDuration,
        requirements: {
          connect: requirements?.map((name: string) => ({ name })) || [],
        },
        positionDescription,
        meals: {
          connect: meals?.map((name: string) => ({ name })) || [],
        },
        benefitsDescription,
        accommodations: {
          connect: accommodations?.map((name: string) => ({ name })) || [],
        },
        experiences: {
          connect: experiences?.map((name: string) => ({ name })) || [],
        },
        environments: {
          connect: environments?.map((name: string) => ({ name })) || [],
        },
        images:
          Array.isArray(images) && images.length > 0
            ? {
                createMany: {
                  data: images.map((imageUrl: string) => ({ imageUrl })),
                },
              }
            : undefined,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        positionName: true,
        recruitCount: true,
        averageWorkHours: true,
        minDuration: true,
        positionCategories: { select: { name: true } },
        meals: { select: { name: true } },
        experiences: { select: { name: true } },
        environments: { select: { name: true } },
        accommodations: { select: { name: true } },
        images: { select: { imageUrl: true } },
        unit: {
          select: {
            city: true,
          },
        },
      },
    });

    return createdWorkPost;
  });

  return newWorkPost;
}

export async function FindWorkPostsByFilter(
  filters: any
): Promise<RawWorkPost[]> {
  return await prisma.workPost.findMany({
    where: filters,
    select: {
      id: true,
      positionName: true,
      averageWorkHours: true,
      minDuration: true,
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
          unitName: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
}

export async function FindWorkPostsById(
  postIds: string[]
): Promise<RawWorkPost[]> {
  return await prisma.workPost.findMany({
    where: {
      id: { in: postIds },
    },
    select: {
      id: true,
      positionName: true,
      averageWorkHours: true,
      minDuration: true,
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
          city: true,
          unitName: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
}

export async function FindUniqueWorkPost(
  workpostId: string
): Promise<RawWorkPost | null> {
  return await prisma.workPost.findUnique({
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
}

export async function FindUniqueWorkPostForES(workpostId: string) {
  return await prisma.workPost.findUnique({
    where: { id: workpostId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      averageWorkHours: true,
      minDuration: true,
      recruitCount: true,
      positionCategories: { select: { name: true } },
      meals: { select: { name: true } },
      experiences: { select: { name: true } },
      environments: { select: { name: true } },
      accommodations: { select: { name: true } },
      unit: {
        select: {
          city: true,
        },
      },
    },
  });
}

export async function CreateFilterSubscription(
  helperProfileId: string,
  name?: string | null,
  city?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  applicantCount?: number | null,
  averageWorkHours?: number | null,
  minDuration?: number | null,
  positionCategories: string[] = [],
  accommodations: string[] = [],
  meals: string[] = [],
  experiences: string[] = [],
  environments: string[] = []
) {
  if (
    !(
      city ||
      startDate ||
      endDate ||
      applicantCount ||
      averageWorkHours ||
      minDuration ||
      positionCategories.length ||
      meals.length ||
      experiences.length ||
      accommodations.length ||
      experiences.length ||
      environments.length
    )
  ) {
    throw new Error("至少需要選擇一個條件");
  }
  // 構建 data
  const data: any = {
    name: name || "未命名的訂閱",
    helperProfileId,
    city: city ?? null,
    startDate: null,
    endDate: null,
    applicantCount: applicantCount ?? null,
    averageWorkHours: averageWorkHours ?? null,
    minDuration: minDuration ?? null,
    positionCategories: undefined,
    accommodations: undefined,
    meals: undefined,
    experiences: undefined,
    environments: undefined,
    filters: {
      city: city ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      applicantCount: applicantCount ?? null,
      averageWorkHours: averageWorkHours ?? null,
      minDuration: minDuration ?? null,
      positionCategories: positionCategories ?? [],
      accommodations: accommodations ?? [],
      meals: meals ?? [],
      experiences: experiences ?? [],
      environments: environments ?? [],
    },
  };

  // 處理日期
  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      throw new Error("Invalid startDate");
    }
    data.startDate = parsedStartDate;
  }

  if (endDate) {
    const parsedEndDate = new Date(endDate);
    if (isNaN(parsedEndDate.getTime())) {
      throw new Error("Invalid endDate");
    }
    data.endDate = parsedEndDate;
  }

  // 處理陣列 connectOrCreate
  if (positionCategories.length > 0) {
    data.positionCategories = {
      connectOrCreate: positionCategories.map((name: string) => ({
        where: { name },
        create: { name },
      })),
    };
  }
  if (accommodations.length > 0) {
    data.accommodations = {
      connectOrCreate: accommodations.map((name: string) => ({
        where: { name },
        create: { name },
      })),
    };
  }
  if (meals.length > 0) {
    data.meals = {
      connectOrCreate: meals.map((name: string) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  if (experiences.length > 0) {
    data.experiences = {
      connectOrCreate: experiences.map((name: string) => ({
        where: { name },
        create: { name },
      })),
    };
  }
  if (environments.length > 0) {
    data.environments = {
      connectOrCreate: environments.map((name: string) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  const newSubscription = await prisma.filterSubscription.create({ data });
  return newSubscription;
}

export async function FindSubscriptions(helperProfileId: string) {
  return await prisma.filterSubscription.findMany({
    where: {
      helperProfileId: helperProfileId,
    },
    select: { id: true, name: true, filters: true },
  });
}

export async function FindUniqueSubscription(subscriptionId: string) {
  return await prisma.filterSubscription.findUnique({
    where: { id: subscriptionId },
    include: { helperProfile: { select: { userId: true } } },
  });
}

export async function FindMatchingWorkPostBySubscriptionId(
  subscriptionId: string
): Promise<MatchedWorkPost[] | null> {
  return await prisma.matchedWorkPost.findMany({
    where: { filterSubscriptionId: subscriptionId },
    include: {
      workPost: {
        select: {
          id: true,
          positionName: true,
          averageWorkHours: true,
          minDuration: true,
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
              unitName: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
    orderBy: { matchedAt: "desc" },
  });
}

export async function CreateMatchingWorkPosts(
  matches: { subscriptionId: string }[],
  postId: string
) {
  await prisma.matchedWorkPost.createMany({
    data: matches.map((m) => ({
      workPostId: postId,
      filterSubscriptionId: m.subscriptionId,
    })),
    skipDuplicates: true,
  });
}
