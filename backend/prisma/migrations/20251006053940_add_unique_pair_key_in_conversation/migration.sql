/*
  Warnings:

  - A unique constraint covering the columns `[uniqueParticipantPair]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `conversations` ADD COLUMN `uniqueParticipantPair` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `conversations_uniqueParticipantPair_key` ON `conversations`(`uniqueParticipantPair`);
