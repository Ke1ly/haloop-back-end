/*
  Warnings:

  - You are about to drop the column `workPostId` on the `Accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `workPostId` on the `Environment` table. All the data in the column will be lost.
  - You are about to drop the column `workPostId` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `mealType` on the `WorkPost` table. All the data in the column will be lost.
  - You are about to drop the column `positionCategory` on the `WorkPost` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Accommodation` DROP FOREIGN KEY `Accommodation_workPostId_fkey`;

-- DropForeignKey
ALTER TABLE `Environment` DROP FOREIGN KEY `Environment_workPostId_fkey`;

-- DropForeignKey
ALTER TABLE `Experience` DROP FOREIGN KEY `Experience_workPostId_fkey`;

-- DropIndex
DROP INDEX `Accommodation_workPostId_fkey` ON `Accommodation`;

-- DropIndex
DROP INDEX `Environment_workPostId_fkey` ON `Environment`;

-- DropIndex
DROP INDEX `Experience_workPostId_fkey` ON `Experience`;

-- AlterTable
ALTER TABLE `Accommodation` DROP COLUMN `workPostId`;

-- AlterTable
ALTER TABLE `Environment` DROP COLUMN `workPostId`;

-- AlterTable
ALTER TABLE `Experience` DROP COLUMN `workPostId`;

-- AlterTable
ALTER TABLE `WorkPost` DROP COLUMN `mealType`,
    DROP COLUMN `positionCategory`;

-- CreateTable
CREATE TABLE `Meal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Meal_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Requirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Requirement_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PositionCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PositionCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkPostPositionExperiences` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkPostPositionExperiences_AB_unique`(`A`, `B`),
    INDEX `_WorkPostPositionExperiences_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkPostPositionEnvironments` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkPostPositionEnvironments_AB_unique`(`A`, `B`),
    INDEX `_WorkPostPositionEnvironments_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkPostPositionAccommodations` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkPostPositionAccommodations_AB_unique`(`A`, `B`),
    INDEX `_WorkPostPositionAccommodations_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkPostPositionMeals` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkPostPositionMeals_AB_unique`(`A`, `B`),
    INDEX `_WorkPostPositionMeals_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkPostPositionRequirements` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkPostPositionRequirements_AB_unique`(`A`, `B`),
    INDEX `_WorkPostPositionRequirements_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkPostPositionCategories` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkPostPositionCategories_AB_unique`(`A`, `B`),
    INDEX `_WorkPostPositionCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionExperiences` ADD CONSTRAINT `_WorkPostPositionExperiences_A_fkey` FOREIGN KEY (`A`) REFERENCES `Experience`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionExperiences` ADD CONSTRAINT `_WorkPostPositionExperiences_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` ADD CONSTRAINT `_WorkPostPositionEnvironments_A_fkey` FOREIGN KEY (`A`) REFERENCES `Environment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` ADD CONSTRAINT `_WorkPostPositionEnvironments_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` ADD CONSTRAINT `_WorkPostPositionAccommodations_A_fkey` FOREIGN KEY (`A`) REFERENCES `Accommodation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` ADD CONSTRAINT `_WorkPostPositionAccommodations_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionMeals` ADD CONSTRAINT `_WorkPostPositionMeals_A_fkey` FOREIGN KEY (`A`) REFERENCES `Meal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionMeals` ADD CONSTRAINT `_WorkPostPositionMeals_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionRequirements` ADD CONSTRAINT `_WorkPostPositionRequirements_A_fkey` FOREIGN KEY (`A`) REFERENCES `Requirement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionRequirements` ADD CONSTRAINT `_WorkPostPositionRequirements_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionCategories` ADD CONSTRAINT `_WorkPostPositionCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `PositionCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionCategories` ADD CONSTRAINT `_WorkPostPositionCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
