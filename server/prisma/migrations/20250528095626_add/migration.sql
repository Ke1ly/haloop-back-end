-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `realname` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `userType` ENUM('STORE', 'HELPER') NOT NULL DEFAULT 'HELPER',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HostProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `unitName` VARCHAR(191) NOT NULL,
    `unitDescription` VARCHAR(191) NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HostProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HelperProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HelperProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `workPostId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Favorite_helperProfileId_workPostId_key`(`helperProfileId`, `workPostId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FilterSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filters` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notifyEmail` BOOLEAN NOT NULL DEFAULT true,
    `notifyPush` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HostProfile` ADD CONSTRAINT `HostProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HelperProfile` ADD CONSTRAINT `HelperProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FilterSubscription` ADD CONSTRAINT `FilterSubscription_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
