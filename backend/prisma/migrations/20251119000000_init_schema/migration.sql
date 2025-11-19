-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMINISTRATOR', 'CREATOR');

-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('TEXT', 'TEXTAREA', 'DATE', 'RADIO', 'CHECKBOX', 'LIST');

-- CreateEnum
CREATE TYPE "SpecificationStatus" AS ENUM ('DRAFT', 'REVIEW', 'SAVED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role_name" "RoleName" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "schemas" (
    "id" UUID NOT NULL,
    "schema_name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_categories" (
    "id" UUID NOT NULL,
    "schema_id" UUID NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "schema_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_fields" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL,
    "data_type" "DataType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "placeholder_text" TEXT,
    "list_target_entity" TEXT,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "schema_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specifications" (
    "id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "schema_id" UUID NOT NULL,
    "title" TEXT,
    "status" "SpecificationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specification_contents" (
    "id" UUID NOT NULL,
    "specification_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "specification_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverables" (
    "id" UUID NOT NULL,
    "specification_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_requirements" (
    "id" UUID NOT NULL,
    "specification_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "contractor_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basic_business_requirements" (
    "id" UUID NOT NULL,
    "specification_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "basic_business_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_tasks" (
    "id" UUID NOT NULL,
    "specification_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "detailed_spec" TEXT NOT NULL,

    CONSTRAINT "business_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE INDEX "schema_categories_schema_id_idx" ON "schema_categories"("schema_id");

-- CreateIndex
CREATE INDEX "schema_fields_category_id_idx" ON "schema_fields"("category_id");

-- CreateIndex
CREATE INDEX "specifications_author_user_id_idx" ON "specifications"("author_user_id");

-- CreateIndex
CREATE INDEX "specifications_schema_id_idx" ON "specifications"("schema_id");

-- CreateIndex
CREATE INDEX "specification_contents_specification_id_idx" ON "specification_contents"("specification_id");

-- CreateIndex
CREATE INDEX "specification_contents_field_id_idx" ON "specification_contents"("field_id");

-- CreateIndex
CREATE INDEX "deliverables_specification_id_idx" ON "deliverables"("specification_id");

-- CreateIndex
CREATE INDEX "contractor_requirements_specification_id_idx" ON "contractor_requirements"("specification_id");

-- CreateIndex
CREATE INDEX "basic_business_requirements_specification_id_idx" ON "basic_business_requirements"("specification_id");

-- CreateIndex
CREATE INDEX "business_tasks_specification_id_idx" ON "business_tasks"("specification_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_categories" ADD CONSTRAINT "schema_categories_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_fields" ADD CONSTRAINT "schema_fields_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "schema_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications" ADD CONSTRAINT "specifications_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specifications" ADD CONSTRAINT "specifications_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schemas"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specification_contents" ADD CONSTRAINT "specification_contents_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specification_contents" ADD CONSTRAINT "specification_contents_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "schema_fields"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_requirements" ADD CONSTRAINT "contractor_requirements_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basic_business_requirements" ADD CONSTRAINT "basic_business_requirements_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tasks" ADD CONSTRAINT "business_tasks_specification_id_fkey" FOREIGN KEY ("specification_id") REFERENCES "specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
