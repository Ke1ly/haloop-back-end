/*
  Warnings:

  - You are about to drop the `Accommodation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Environment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Experience` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Favorite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FilterSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HelperProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HostProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Meal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PositionCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Requirement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkFilterSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WorkFilterSubscriptionAccommodations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WorkFilterSubscriptionEnvironments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WorkFilterSubscriptionExperiences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WorkFilterSubscriptionMeals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WorkFilterSubscriptionPositionCategories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Favorite` DROP FOREIGN KEY `Favorite_helperProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `FilterSubscription` DROP FOREIGN KEY `FilterSubscription_helperProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `HelperProfile` DROP FOREIGN KEY `HelperProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `HostProfile` DROP FOREIGN KEY `HostProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionAccommodations` DROP FOREIGN KEY `_WorkFilterSubscriptionAccommodations_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionAccommodations` DROP FOREIGN KEY `_WorkFilterSubscriptionAccommodations_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionEnvironments` DROP FOREIGN KEY `_WorkFilterSubscriptionEnvironments_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionEnvironments` DROP FOREIGN KEY `_WorkFilterSubscriptionEnvironments_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionExperiences` DROP FOREIGN KEY `_WorkFilterSubscriptionExperiences_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionExperiences` DROP FOREIGN KEY `_WorkFilterSubscriptionExperiences_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionMeals` DROP FOREIGN KEY `_WorkFilterSubscriptionMeals_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionMeals` DROP FOREIGN KEY `_WorkFilterSubscriptionMeals_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` DROP FOREIGN KEY `_WorkFilterSubscriptionPositionCategories_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` DROP FOREIGN KEY `_WorkFilterSubscriptionPositionCategories_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` DROP FOREIGN KEY `_WorkPostPositionAccommodations_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` DROP FOREIGN KEY `_WorkPostPositionAccommodations_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionCategories` DROP FOREIGN KEY `_WorkPostPositionCategories_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionCategories` DROP FOREIGN KEY `_WorkPostPositionCategories_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` DROP FOREIGN KEY `_WorkPostPositionEnvironments_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` DROP FOREIGN KEY `_WorkPostPositionEnvironments_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionExperiences` DROP FOREIGN KEY `_WorkPostPositionExperiences_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionExperiences` DROP FOREIGN KEY `_WorkPostPositionExperiences_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionMeals` DROP FOREIGN KEY `_WorkPostPositionMeals_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionMeals` DROP FOREIGN KEY `_WorkPostPositionMeals_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionRequirements` DROP FOREIGN KEY `_WorkPostPositionRequirements_A_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionRequirements` DROP FOREIGN KEY `_WorkPostPositionRequirements_B_fkey`;

-- DropTable
DROP TABLE `Accommodation`;

-- DropTable
DROP TABLE `Environment`;

-- DropTable
DROP TABLE `Experience`;

-- DropTable
DROP TABLE `Favorite`;

-- DropTable
DROP TABLE `FilterSubscription`;

-- DropTable
DROP TABLE `HelperProfile`;

-- DropTable
DROP TABLE `HostProfile`;

-- DropTable
DROP TABLE `Meal`;

-- DropTable
DROP TABLE `PositionCategory`;

-- DropTable
DROP TABLE `Requirement`;

-- DropTable
DROP TABLE `User`;

-- DropTable
DROP TABLE `WorkFilterSubscription`;

-- DropTable
DROP TABLE `WorkPost`;

-- DropTable
DROP TABLE `_WorkFilterSubscriptionAccommodations`;

-- DropTable
DROP TABLE `_WorkFilterSubscriptionEnvironments`;

-- DropTable
DROP TABLE `_WorkFilterSubscriptionExperiences`;

-- DropTable
DROP TABLE `_WorkFilterSubscriptionMeals`;

-- DropTable
DROP TABLE `_WorkFilterSubscriptionPositionCategories`;

-- CreateTable
CREATE TABLE `work_posts` (
    `id` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `recruitCount` INTEGER NOT NULL,
    `positionName` VARCHAR(191) NOT NULL,
    `averageWorkHours` INTEGER NOT NULL,
    `minDuration` INTEGER NOT NULL,
    `positionDescription` VARCHAR(191) NOT NULL,
    `benefitsDescription` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_post_images` (
    `id` VARCHAR(191) NOT NULL,
    `workPostId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experience_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `experience_options_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `environment_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `environment_options_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accommodation_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `accommodation_options_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `meal_options_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requirement_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `requirement_options_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `position_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `position_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `realname` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `userType` ENUM('HOST', 'HELPER') NOT NULL DEFAULT 'HELPER',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `host_profiles` (
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

    UNIQUE INDEX `host_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `helper_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `helper_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `workPostId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `favorites_helperProfileId_workPostId_key`(`helperProfileId`, `workPostId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `filter_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `applicantCount` INTEGER NULL,
    `averageWorkHours` INTEGER NULL,
    `minStay` VARCHAR(191) NULL,
    `filters` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notifyEmail` BOOLEAN NOT NULL DEFAULT true,
    `notifyPush` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FilterSubscriptionExperiences` (
    `A` INTEGER NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FilterSubscriptionExperiences_AB_unique`(`A`, `B`),
    INDEX `_FilterSubscriptionExperiences_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FilterSubscriptionEnvironments` (
    `A` INTEGER NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FilterSubscriptionEnvironments_AB_unique`(`A`, `B`),
    INDEX `_FilterSubscriptionEnvironments_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FilterSubscriptionAccommodations` (
    `A` INTEGER NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FilterSubscriptionAccommodations_AB_unique`(`A`, `B`),
    INDEX `_FilterSubscriptionAccommodations_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FilterSubscriptionPositionCategories` (
    `A` VARCHAR(191) NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_FilterSubscriptionPositionCategories_AB_unique`(`A`, `B`),
    INDEX `_FilterSubscriptionPositionCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_FilterSubscriptionMeals` (
    `A` VARCHAR(191) NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_FilterSubscriptionMeals_AB_unique`(`A`, `B`),
    INDEX `_FilterSubscriptionMeals_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `work_posts` ADD CONSTRAINT `work_posts_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `host_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_post_images` ADD CONSTRAINT `work_post_images_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `host_profiles` ADD CONSTRAINT `host_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `helper_profiles` ADD CONSTRAINT `helper_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `helper_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `filter_subscriptions` ADD CONSTRAINT `filter_subscriptions_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `helper_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionExperiences` ADD CONSTRAINT `_WorkPostPositionExperiences_A_fkey` FOREIGN KEY (`A`) REFERENCES `experience_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionExperiences` ADD CONSTRAINT `_WorkPostPositionExperiences_B_fkey` FOREIGN KEY (`B`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionExperiences` ADD CONSTRAINT `_FilterSubscriptionExperiences_A_fkey` FOREIGN KEY (`A`) REFERENCES `experience_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionExperiences` ADD CONSTRAINT `_FilterSubscriptionExperiences_B_fkey` FOREIGN KEY (`B`) REFERENCES `filter_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` ADD CONSTRAINT `_WorkPostPositionEnvironments_A_fkey` FOREIGN KEY (`A`) REFERENCES `environment_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` ADD CONSTRAINT `_WorkPostPositionEnvironments_B_fkey` FOREIGN KEY (`B`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionEnvironments` ADD CONSTRAINT `_FilterSubscriptionEnvironments_A_fkey` FOREIGN KEY (`A`) REFERENCES `environment_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionEnvironments` ADD CONSTRAINT `_FilterSubscriptionEnvironments_B_fkey` FOREIGN KEY (`B`) REFERENCES `filter_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` ADD CONSTRAINT `_WorkPostPositionAccommodations_A_fkey` FOREIGN KEY (`A`) REFERENCES `accommodation_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` ADD CONSTRAINT `_WorkPostPositionAccommodations_B_fkey` FOREIGN KEY (`B`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionAccommodations` ADD CONSTRAINT `_FilterSubscriptionAccommodations_A_fkey` FOREIGN KEY (`A`) REFERENCES `accommodation_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionAccommodations` ADD CONSTRAINT `_FilterSubscriptionAccommodations_B_fkey` FOREIGN KEY (`B`) REFERENCES `filter_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionMeals` ADD CONSTRAINT `_WorkPostPositionMeals_A_fkey` FOREIGN KEY (`A`) REFERENCES `meal_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionMeals` ADD CONSTRAINT `_WorkPostPositionMeals_B_fkey` FOREIGN KEY (`B`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionRequirements` ADD CONSTRAINT `_WorkPostPositionRequirements_A_fkey` FOREIGN KEY (`A`) REFERENCES `requirement_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionRequirements` ADD CONSTRAINT `_WorkPostPositionRequirements_B_fkey` FOREIGN KEY (`B`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionCategories` ADD CONSTRAINT `_WorkPostPositionCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `position_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionCategories` ADD CONSTRAINT `_WorkPostPositionCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `work_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionPositionCategories` ADD CONSTRAINT `_FilterSubscriptionPositionCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `filter_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionPositionCategories` ADD CONSTRAINT `_FilterSubscriptionPositionCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `position_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionMeals` ADD CONSTRAINT `_FilterSubscriptionMeals_A_fkey` FOREIGN KEY (`A`) REFERENCES `filter_subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilterSubscriptionMeals` ADD CONSTRAINT `_FilterSubscriptionMeals_B_fkey` FOREIGN KEY (`B`) REFERENCES `meal_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
