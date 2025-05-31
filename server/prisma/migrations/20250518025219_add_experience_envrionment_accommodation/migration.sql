/*
  Warnings:

  - You are about to drop the column `accommodationType` on the `WorkPost` table. All the data in the column will be lost.
  - You are about to drop the column `environment` on the `WorkPost` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `WorkPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `WorkPost` DROP COLUMN `accommodationType`,
    DROP COLUMN `environment`,
    DROP COLUMN `experience`;

-- CreateTable
CREATE TABLE `Experience` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `workPostId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Environment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `workPostId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accommodationType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `workPostId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Experience` ADD CONSTRAINT `Experience_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `WorkPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Environment` ADD CONSTRAINT `Environment_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `WorkPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accommodationType` ADD CONSTRAINT `accommodationType_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `WorkPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
