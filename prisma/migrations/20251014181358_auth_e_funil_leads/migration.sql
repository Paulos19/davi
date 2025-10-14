/*
  Warnings:

  - A unique constraint covering the columns `[contato]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('ENTRANTE', 'QUALIFICADO', 'ATENDIDO', 'VENDA_REALIZADA', 'PERDIDO');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "atividadePrincipal" TEXT,
ADD COLUMN     "faturamentoEstimado" TEXT,
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'ENTRANTE',
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "valorVenda" DOUBLE PRECISION,
ADD COLUMN     "vendaRealizada" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "produtoDeInteresse" DROP NOT NULL,
ALTER COLUMN "necessidadePrincipal" DROP NOT NULL,
ALTER COLUMN "orcamento" DROP NOT NULL,
ALTER COLUMN "prazo" DROP NOT NULL,
ALTER COLUMN "classificacao" DROP NOT NULL,
ALTER COLUMN "resumoDaConversa" DROP NOT NULL,
ALTER COLUMN "historicoCompleto" DROP NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_contato_key" ON "Lead"("contato");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
