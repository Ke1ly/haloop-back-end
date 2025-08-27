-- CreateTable
CREATE TABLE `matched_work_posts` (
    `id` VARCHAR(191) NOT NULL,
    `workPostId` VARCHAR(191) NOT NULL,
    `filterSubscriptionId` VARCHAR(191) NOT NULL,
    `matchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isNotified` BOOLEAN NOT NULL DEFAULT true,

    INDEX `matched_work_posts_filterSubscriptionId_matchedAt_idx`(`filterSubscriptionId`, `matchedAt`),
    UNIQUE INDEX `matched_work_posts_workPostId_filterSubscriptionId_key`(`workPostId`, `filterSubscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `matched_work_posts` ADD CONSTRAINT `matched_work_posts_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matched_work_posts` ADD CONSTRAINT `matched_work_posts_filterSubscriptionId_fkey` FOREIGN KEY (`filterSubscriptionId`) REFERENCES `filter_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
