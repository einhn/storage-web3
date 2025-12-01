-- CreateTable
CREATE TABLE "File" (
    "id" BIGSERIAL NOT NULL,
    "cid" TEXT NOT NULL,
    "phash" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "groupId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFile" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "fileId" BIGINT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_cid_key" ON "File"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "UserFile_userId_fileId_key" ON "UserFile"("userId", "fileId");

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
