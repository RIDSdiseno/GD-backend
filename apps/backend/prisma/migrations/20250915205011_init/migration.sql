-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "rol" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "public"."comunas" (
    "id_comuna" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "comunas_pkey" PRIMARY KEY ("id_comuna")
);

-- CreateTable
CREATE TABLE "public"."estados" (
    "id_estado" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id_estado")
);

-- CreateTable
CREATE TABLE "public"."marcas" (
    "id_marca" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id_marca")
);

-- CreateTable
CREATE TABLE "public"."segmentacion" (
    "id_segmentacion" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "segmentacion_pkey" PRIMARY KEY ("id_segmentacion")
);

-- CreateTable
CREATE TABLE "public"."tipo_cliente" (
    "id_tipo_cliente" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipo_cliente_pkey" PRIMARY KEY ("id_tipo_cliente")
);

-- CreateTable
CREATE TABLE "public"."usuario_marcas" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_marca" INTEGER NOT NULL,

    CONSTRAINT "usuario_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id_lead" SERIAL NOT NULL,
    "codigo_cliente" VARCHAR(50) NOT NULL,
    "fecha_ingreso" DATE NOT NULL DEFAULT CURRENT_DATE,
    "id_marca" INTEGER NOT NULL,
    "id_categoria" INTEGER,
    "id_tipo_cliente" INTEGER,
    "id_comuna" INTEGER,
    "id_estado" INTEGER,
    "id_segmentacion" INTEGER,
    "id_usuario" INTEGER,
    "nombre_cliente" VARCHAR(150) NOT NULL,
    "plataforma" VARCHAR(50),
    "fecha_evento" DATE,
    "dia" VARCHAR(20),
    "mes" VARCHAR(20),
    "semana" INTEGER,
    "anio" INTEGER,
    "telefono" VARCHAR(20),
    "whatsapp_link" TEXT,
    "email" VARCHAR(150),
    "monto_cotizado" DECIMAL(12,2),
    "fecha_cierre" DATE,
    "seguimiento" TEXT,
    "fecha_seguimiento" DATE,
    "motivo_evento" VARCHAR(150),
    "conversar" BOOLEAN DEFAULT false,
    "numero_cotizacion" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id_lead")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "public"."Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "public"."categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "comunas_nombre_key" ON "public"."comunas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estados_nombre_key" ON "public"."estados"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "public"."marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "segmentacion_nombre_key" ON "public"."segmentacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_cliente_nombre_key" ON "public"."tipo_cliente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_marcas_id_usuario_id_marca_key" ON "public"."usuario_marcas"("id_usuario", "id_marca");

-- CreateIndex
CREATE UNIQUE INDEX "leads_codigo_cliente_key" ON "public"."leads"("codigo_cliente");

-- CreateIndex
CREATE INDEX "idx_leads_comuna" ON "public"."leads"("id_comuna");

-- CreateIndex
CREATE INDEX "idx_leads_estado" ON "public"."leads"("id_estado");

-- CreateIndex
CREATE INDEX "idx_leads_marca" ON "public"."leads"("id_marca");

-- CreateIndex
CREATE INDEX "idx_leads_usuario" ON "public"."leads"("id_usuario");

-- AddForeignKey
ALTER TABLE "public"."usuario_marcas" ADD CONSTRAINT "usuario_marcas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuario_marcas" ADD CONSTRAINT "usuario_marcas_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "public"."marcas"("id_marca") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categorias"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_comuna_fkey" FOREIGN KEY ("id_comuna") REFERENCES "public"."comunas"("id_comuna") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "public"."estados"("id_estado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "public"."marcas"("id_marca") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_segmentacion_fkey" FOREIGN KEY ("id_segmentacion") REFERENCES "public"."segmentacion"("id_segmentacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_tipo_cliente_fkey" FOREIGN KEY ("id_tipo_cliente") REFERENCES "public"."tipo_cliente"("id_tipo_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
