/*
  Warnings:

  - You are about to drop the column `minStay` on the `filter_subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `filter_subscriptions` DROP COLUMN `minStay`,
    ADD COLUMN `minDuration` INTEGER NULL;
