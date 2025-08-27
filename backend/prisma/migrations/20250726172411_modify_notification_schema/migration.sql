/*
  Warnings:

  - You are about to drop the column `unitId` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_unitId_fkey`;

-- DropIndex
DROP INDEX `notifications_unitId_fkey` ON `notifications`;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `unitId`;
