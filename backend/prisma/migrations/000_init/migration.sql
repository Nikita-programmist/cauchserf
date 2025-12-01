-- Initial schema derived from Supabase structures
CREATE TYPE "UserRole" AS ENUM ('TRAVELER', 'HOST', 'ADMIN');
CREATE TYPE "StayStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "User" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  name text,
  "avatarUrl" text,
  role "UserRole" NOT NULL DEFAULT 'TRAVELER',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "HostProfile" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE REFERENCES "User"(id),
  bio text,
  city text,
  country text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Place" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "hostProfileId" uuid NOT NULL REFERENCES "HostProfile"(id),
  title text NOT NULL,
  description text,
  city text NOT NULL,
  country text NOT NULL,
  address text,
  capacity integer,
  "pricePerNight" integer,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "StayRequest" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "placeId" uuid NOT NULL REFERENCES "Place"(id),
  "guestId" uuid NOT NULL REFERENCES "User"(id),
  "hostId" uuid NOT NULL REFERENCES "User"(id),
  "checkIn" timestamptz,
  "checkOut" timestamptz,
  message text,
  status "StayStatus" NOT NULL DEFAULT 'PENDING',
  "roomId" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Conversation" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "stayRequestId" uuid REFERENCES "StayRequest"(id),
  "hostId" uuid NOT NULL REFERENCES "User"(id),
  "guestId" uuid NOT NULL REFERENCES "User"(id),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Message" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" uuid NOT NULL REFERENCES "Conversation"(id),
  "senderId" uuid NOT NULL REFERENCES "User"(id),
  content text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Review" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "authorId" uuid NOT NULL REFERENCES "User"(id),
  "targetUserId" uuid NOT NULL REFERENCES "User"(id),
  "stayRequestId" uuid REFERENCES "StayRequest"(id),
  rating integer NOT NULL,
  comment text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
