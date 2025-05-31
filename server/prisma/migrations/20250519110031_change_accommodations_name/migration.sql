/*
  Warnings:

  - You are about to drop the `accommodationType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `accommodationType` DROP FOREIGN KEY `accommodationType_workPostId_fkey`;

-- DropTable
DROP TABLE `accommodationType`;

-- CreateTable
CREATE TABLE `Accommodation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `workPostId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Accommodation` ADD CONSTRAINT `Accommodation_workPostId_fkey` FOREIGN KEY (`workPostId`) REFERENCES `WorkPost`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
