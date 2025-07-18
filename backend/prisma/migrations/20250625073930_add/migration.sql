-- CreateTable
CREATE TABLE `Availability` (
    `id` VARCHAR(191) NOT NULL,
    `workPostId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `maxRecruitCount` INTEGER NOT NULL,
    `remainingRecruitCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `workPostId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `applications_helperProfileId_workPostId_key`(`helperProfileId`, `workPostId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Availability` ADD CONSTRAINT `Availability_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `work_posts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `work_posts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `helper_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
