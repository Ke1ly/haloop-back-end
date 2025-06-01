-- CreateTable
CREATE TABLE `WorkPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitName` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `unitDescription` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `recruitCount` INTEGER NOT NULL,
    `imageUrls` JSON NOT NULL,
    `positionName` VARCHAR(191) NOT NULL,
    `positionCategory` VARCHAR(191) NOT NULL,
    `averageWorkHours` INTEGER NOT NULL,
    `minStay` VARCHAR(191) NOT NULL,
    `positionDescription` VARCHAR(191) NOT NULL,
    `accommodationType` JSON NOT NULL,
    `mealType` VARCHAR(191) NOT NULL,
    `experience` JSON NOT NULL,
    `environment` JSON NOT NULL,
    `benefitsDescription` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
