-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "produtoDeInteresse" TEXT NOT NULL,
    "necessidadePrincipal" TEXT NOT NULL,
    "orcamento" TEXT NOT NULL,
    "prazo" TEXT NOT NULL,
    "classificacao" TEXT NOT NULL,
    "resumoDaConversa" TEXT NOT NULL,
    "historicoCompleto" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
