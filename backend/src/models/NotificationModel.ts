import prisma from "../config/database.js";
import { Notification } from "../types/Subscription.js";

export async function createNotifications(
  helperProfiles: { id: string; userId: string }[],
  notificationBase: {
    title: string;
    message: string;
    data: {
      workPostId: string;
      unitName: string;
      positionName: string;
    };
  }
) {
  const notificationsToCreate = helperProfiles.map((profile) => ({
    helperProfileId: profile.id,
    title: notificationBase.title,
    message: notificationBase.message,
    data: notificationBase.data,
    isRead: false,
  }));
  await prisma.notification.createMany({ data: notificationsToCreate });
}

export async function getUnreadCounts(helperProfileIds: string[]) {
  return await prisma.notification.groupBy({
    by: ["helperProfileId"],
    _count: { id: true },
    where: {
      helperProfileId: { in: helperProfileIds },
      isRead: false,
    },
  });
}

export async function getUnreadCountByHelperProfileId(helperProfileId: string) {
  return await prisma.notification.count({
    where: {
      helperProfileId: helperProfileId,
      isRead: false,
    },
  });
}

export async function markNotificationsRead(helperProfileId: string) {
  await prisma.notification.updateMany({
    where: {
      helperProfileId: helperProfileId,
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function FindNotifications(
  helperProfileId: string,
  limit: number,
  offset: number
): Promise<Notification[]> {
  return await prisma.notification.findMany({
    where: { helperProfileId: helperProfileId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      message: true,
      data: true,
      createdAt: true,
      isRead: true,
    },
  });
}
