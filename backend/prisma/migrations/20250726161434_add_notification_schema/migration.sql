-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `data` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_helperProfileId_createdAt_idx`(`helperProfileId`, `createdAt`),
    INDEX `notifications_helperProfileId_isRead_idx`(`helperProfileId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `helper_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `host_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
