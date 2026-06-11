-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
