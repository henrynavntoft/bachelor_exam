/*
  Warnings:

  - A unique constraint covering the columns `[userId,eventId]` on the table `Attendee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attendee_userId_eventId_key" ON "Attendee"("userId", "eventId");
