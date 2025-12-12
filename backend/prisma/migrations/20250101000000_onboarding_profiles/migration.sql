-- Update UserRole enum to use GUEST/HOST
CREATE TYPE "UserRole_new" AS ENUM ('GUEST', 'HOST');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole_new" USING (
    CASE
      WHEN "role" = 'TRAVELER' THEN 'GUEST'
      WHEN "role" = 'HOST' THEN 'HOST'
      WHEN "role" = 'GUEST' THEN 'GUEST'
      ELSE NULL
    END
  )::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Create guest profiles
CREATE TABLE "GuestProfile" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "bio" TEXT,
  "city" TEXT,
  "country" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuestProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestProfile_userId_key" ON "GuestProfile"("userId");

ALTER TABLE "GuestProfile"
  ADD CONSTRAINT "GuestProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
