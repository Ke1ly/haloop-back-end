/*
  Warnings:

  - The values [STORE] on the enum `User_userType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `WorkFilterSubscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WorkPost` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionAccommodations` DROP FOREIGN KEY `_WorkFilterSubscriptionAccommodations_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionEnvironments` DROP FOREIGN KEY `_WorkFilterSubscriptionEnvironments_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionExperiences` DROP FOREIGN KEY `_WorkFilterSubscriptionExperiences_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionMeals` DROP FOREIGN KEY `_WorkFilterSubscriptionMeals_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` DROP FOREIGN KEY `_WorkFilterSubscriptionPositionCategories_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` DROP FOREIGN KEY `_WorkPostPositionAccommodations_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionCategories` DROP FOREIGN KEY `_WorkPostPositionCategories_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` DROP FOREIGN KEY `_WorkPostPositionEnvironments_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionExperiences` DROP FOREIGN KEY `_WorkPostPositionExperiences_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionMeals` DROP FOREIGN KEY `_WorkPostPositionMeals_B_fkey`;

-- DropForeignKey
ALTER TABLE `_WorkPostPositionRequirements` DROP FOREIGN KEY `_WorkPostPositionRequirements_B_fkey`;

-- AlterTable
ALTER TABLE `User` MODIFY `userType` ENUM('HOST', 'HELPER') NOT NULL DEFAULT 'HELPER';

-- AlterTable
ALTER TABLE `WorkFilterSubscription` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `WorkPost` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `_WorkFilterSubscriptionAccommodations` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkFilterSubscriptionEnvironments` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkFilterSubscriptionExperiences` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkFilterSubscriptionMeals` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkPostPositionAccommodations` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkPostPositionCategories` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkPostPositionEnvironments` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkPostPositionExperiences` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkPostPositionMeals` MODIFY `B` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `_WorkPostPositionRequirements` MODIFY `B` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionExperiences` ADD CONSTRAINT `_WorkPostPositionExperiences_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionExperiences` ADD CONSTRAINT `_WorkFilterSubscriptionExperiences_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionEnvironments` ADD CONSTRAINT `_WorkPostPositionEnvironments_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionEnvironments` ADD CONSTRAINT `_WorkFilterSubscriptionEnvironments_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionAccommodations` ADD CONSTRAINT `_WorkPostPositionAccommodations_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionAccommodations` ADD CONSTRAINT `_WorkFilterSubscriptionAccommodations_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionMeals` ADD CONSTRAINT `_WorkPostPositionMeals_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionMeals` ADD CONSTRAINT `_WorkFilterSubscriptionMeals_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionRequirements` ADD CONSTRAINT `_WorkPostPositionRequirements_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkPostPositionCategories` ADD CONSTRAINT `_WorkPostPositionCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` ADD CONSTRAINT `_WorkFilterSubscriptionPositionCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
