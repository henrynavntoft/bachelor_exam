/*
  Warnings:

  - A unique constraint covering the columns `[ratedUserId,raterUserId,eventId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `Rating` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Rating_ratedUserId_raterUserId_key";

-- AlterTable
ALTER TABLE "Attendee" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "capacity" INTEGER;

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Rating_ratedUserId_raterUserId_eventId_key" ON "Rating"("ratedUserId", "raterUserId", "eventId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
