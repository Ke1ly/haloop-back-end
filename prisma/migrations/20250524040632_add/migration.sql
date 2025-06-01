-- CreateTable
CREATE TABLE `WorkFilterSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `helperId` INTEGER NOT NULL,
    `city` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `applicantCount` INTEGER NULL,
    `averageWorkHours` INTEGER NULL,
    `minStay` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkFilterSubscriptionExperiences` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkFilterSubscriptionExperiences_AB_unique`(`A`, `B`),
    INDEX `_WorkFilterSubscriptionExperiences_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkFilterSubscriptionEnvironments` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkFilterSubscriptionEnvironments_AB_unique`(`A`, `B`),
    INDEX `_WorkFilterSubscriptionEnvironments_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkFilterSubscriptionAccommodations` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkFilterSubscriptionAccommodations_AB_unique`(`A`, `B`),
    INDEX `_WorkFilterSubscriptionAccommodations_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkFilterSubscriptionMeals` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkFilterSubscriptionMeals_AB_unique`(`A`, `B`),
    INDEX `_WorkFilterSubscriptionMeals_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_WorkFilterSubscriptionPositionCategories` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_WorkFilterSubscriptionPositionCategories_AB_unique`(`A`, `B`),
    INDEX `_WorkFilterSubscriptionPositionCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionExperiences` ADD CONSTRAINT `_WorkFilterSubscriptionExperiences_A_fkey` FOREIGN KEY (`A`) REFERENCES `Experience`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionExperiences` ADD CONSTRAINT `_WorkFilterSubscriptionExperiences_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionEnvironments` ADD CONSTRAINT `_WorkFilterSubscriptionEnvironments_A_fkey` FOREIGN KEY (`A`) REFERENCES `Environment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionEnvironments` ADD CONSTRAINT `_WorkFilterSubscriptionEnvironments_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionAccommodations` ADD CONSTRAINT `_WorkFilterSubscriptionAccommodations_A_fkey` FOREIGN KEY (`A`) REFERENCES `Accommodation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionAccommodations` ADD CONSTRAINT `_WorkFilterSubscriptionAccommodations_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionMeals` ADD CONSTRAINT `_WorkFilterSubscriptionMeals_A_fkey` FOREIGN KEY (`A`) REFERENCES `Meal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionMeals` ADD CONSTRAINT `_WorkFilterSubscriptionMeals_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` ADD CONSTRAINT `_WorkFilterSubscriptionPositionCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `PositionCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_WorkFilterSubscriptionPositionCategories` ADD CONSTRAINT `_WorkFilterSubscriptionPositionCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkFilterSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
