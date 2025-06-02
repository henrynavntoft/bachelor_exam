-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SPECIAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventType" "EventType" NOT NULL DEFAULT 'SPECIAL',
ADD COLUMN     "pricePerPerson" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "ratedUserId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_ratedUserId_raterUserId_key" ON "Rating"("ratedUserId", "raterUserId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
