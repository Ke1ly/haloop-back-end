/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Accommodation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Environment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Experience` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Accommodation_name_key` ON `Accommodation`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `Environment_name_key` ON `Environment`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `Experience_name_key` ON `Experience`(`name`);
