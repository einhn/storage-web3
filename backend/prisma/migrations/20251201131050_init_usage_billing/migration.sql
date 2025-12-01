-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "externalId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageSnapshot" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalBytes" BIGINT NOT NULL,
    "billedAmount" DECIMAL(65,30) NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "commitTxHash" TEXT,
    "commitBlock" BIGINT,
    "settleTxHash" TEXT,
    "settleBlock" BIGINT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UsageSnapshot_userId_year_month_key" ON "UsageSnapshot"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "UsageSnapshot" ADD CONSTRAINT "UsageSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
