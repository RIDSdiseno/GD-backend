/*
  Warnings:

  - You are about to drop the column `fecha_cierre` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `numero_cotizacion` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `seguimiento` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_link` on the `leads` table. All the data in the column will be lost.
  - The `dia` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `mes` column on the `leads` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `usuario_marcas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `usuario_marcas` table. All the data in the column will be lost.
  - You are about to drop the column `id_marca` on the `usuario_marcas` table. All the data in the column will be lost.
  - You are about to drop the column `id_usuario` on the `usuario_marcas` table. All the data in the column will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nro_cotizacion]` on the table `leads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `marcaId` to the `usuario_marcas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `usuario_marcas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_id_marca_fkey";

-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."usuario_marcas" DROP CONSTRAINT "usuario_marcas_id_marca_fkey";

-- DropForeignKey
ALTER TABLE "public"."usuario_marcas" DROP CONSTRAINT "usuario_marcas_id_usuario_fkey";

-- DropIndex
DROP INDEX "public"."categorias_nombre_key";

-- DropIndex
DROP INDEX "public"."estados_nombre_key";

-- DropIndex
DROP INDEX "public"."idx_leads_usuario";

-- DropIndex
DROP INDEX "public"."segmentacion_nombre_key";

-- DropIndex
DROP INDEX "public"."tipo_cliente_nombre_key";

-- DropIndex
DROP INDEX "public"."usuario_marcas_id_usuario_id_marca_key";

-- AlterTable
ALTER TABLE "public"."categorias" ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."comunas" ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."estados" ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."leads" DROP COLUMN "fecha_cierre",
DROP COLUMN "numero_cotizacion",
DROP COLUMN "seguimiento",
DROP COLUMN "whatsapp_link",
ADD COLUMN     "nro_cotizacion" TEXT,
ADD COLUMN     "seguimiento_1" TEXT,
ADD COLUMN     "ultimo_cambio" TIMESTAMP(3),
ALTER COLUMN "codigo_cliente" SET DATA TYPE TEXT,
ALTER COLUMN "fecha_ingreso" DROP NOT NULL,
ALTER COLUMN "fecha_ingreso" DROP DEFAULT,
ALTER COLUMN "fecha_ingreso" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "id_marca" DROP NOT NULL,
ALTER COLUMN "nombre_cliente" SET DATA TYPE TEXT,
ALTER COLUMN "plataforma" SET DATA TYPE TEXT,
ALTER COLUMN "fecha_evento" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "dia",
ADD COLUMN     "dia" INTEGER,
DROP COLUMN "mes",
ADD COLUMN     "mes" INTEGER,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "monto_cotizado" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "fecha_seguimiento" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "motivo_evento" SET DATA TYPE TEXT,
ALTER COLUMN "conversar" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."marcas" ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."segmentacion" ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."tipo_cliente" ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."usuario_marcas" DROP CONSTRAINT "usuario_marcas_pkey",
DROP COLUMN "id",
DROP COLUMN "id_marca",
DROP COLUMN "id_usuario",
ADD COLUMN     "marcaId" INTEGER NOT NULL,
ADD COLUMN     "usuarioId" INTEGER NOT NULL,
ADD CONSTRAINT "usuario_marcas_pkey" PRIMARY KEY ("usuarioId", "marcaId");

-- DropTable
DROP TABLE "public"."Usuario";

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "id_marca" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_nro_cotizacion_key" ON "public"."leads"("nro_cotizacion");

-- CreateIndex
CREATE INDEX "leads_fecha_ingreso_idx" ON "public"."leads"("fecha_ingreso");

-- CreateIndex
CREATE INDEX "leads_fecha_evento_idx" ON "public"."leads"("fecha_evento");

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "public"."marcas"("id_marca") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_marcas" ADD CONSTRAINT "usuario_marcas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_marcas" ADD CONSTRAINT "usuario_marcas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "public"."marcas"("id_marca") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "public"."marcas"("id_marca") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_leads_comuna" RENAME TO "leads_id_comuna_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_estado" RENAME TO "leads_id_estado_idx";

-- RenameIndex
ALTER INDEX "public"."idx_leads_marca" RENAME TO "leads_id_marca_idx";
