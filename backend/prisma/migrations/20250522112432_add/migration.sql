/*
  Warnings:

  - Added the required column `city` to the `WorkPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `WorkPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `WorkPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `WorkPost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `WorkPost` ADD COLUMN `city` VARCHAR(191) NOT NULL,
    ADD COLUMN `district` VARCHAR(191) NOT NULL,
    ADD COLUMN `latitude` DOUBLE NOT NULL,
    ADD COLUMN `longitude` DOUBLE NOT NULL;
