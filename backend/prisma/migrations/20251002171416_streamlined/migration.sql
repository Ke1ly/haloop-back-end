/*
  Warnings:

  - You are about to drop the column `birthDate` on the `helper_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `helper_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `messages` table. All the data in the column will be lost.
  - The values [SYSTEM] on the enum `messages_messageType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorites` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `unitDescription` on table `host_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Availability` DROP FOREIGN KEY `Availability_workPostId_fkey`;

-- DropForeignKey
ALTER TABLE `applications` DROP FOREIGN KEY `applications_helperProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `applications` DROP FOREIGN KEY `applications_workPostId_fkey`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_helperProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_workPostId_fkey`;

-- DropIndex
DROP INDEX `users_phone_key` ON `users`;

-- AlterTable
ALTER TABLE `helper_profiles` DROP COLUMN `birthDate`,
    DROP COLUMN `gender`;

-- AlterTable
ALTER TABLE `host_profiles` MODIFY `unitDescription` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `messages` DROP COLUMN `attachments`,
    MODIFY `messageType` ENUM('TEXT', 'IMAGE', 'FILE') NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `users` DROP COLUMN `avatar`,
    DROP COLUMN `isVerified`,
    DROP COLUMN `phone`;

-- DropTable
DROP TABLE `Availability`;

-- DropTable
DROP TABLE `applications`;

-- DropTable
DROP TABLE `favorites`;

-- CreateIndex
CREATE INDEX `helper_profiles_userId_idx` ON `helper_profiles`(`userId`);

-- CreateIndex
CREATE INDEX `messages_conversationId_createdAt_idx` ON `messages`(`conversationId`, `createdAt`);

-- CreateIndex
CREATE INDEX `messages_conversationId_senderId_isRead_idx` ON `messages`(`conversationId`, `senderId`, `isRead`);

-- CreateIndex
CREATE INDEX `work_posts_startDate_idx` ON `work_posts`(`startDate`);

-- CreateIndex
CREATE INDEX `work_posts_endDate_idx` ON `work_posts`(`endDate`);

-- RenameIndex
ALTER TABLE `conversation_participants` RENAME INDEX `conversation_participants_userId_fkey` TO `conversation_participants_userId_idx`;
