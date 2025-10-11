/*
  Warnings:

  - Made the column `bio` on table `helper_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `helper_profiles` MODIFY `bio` VARCHAR(191) NOT NULL;
