import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const cachedPrisma = globalForPrisma.prisma;
const cachedClientHasBtebModels =
  typeof cachedPrisma?.btebNotice?.findMany === "function" &&
  typeof cachedPrisma?.examResult?.findMany === "function";
const cachedClientHasHigherStudyModels =
  typeof cachedPrisma?.higherStudyResource?.findMany === "function" &&
  typeof cachedPrisma?.universityGuide?.findMany === "function";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cachedClientHasMaterialModerationFields(client: PrismaClient | undefined) {
  if (!client) return false;

  const runtimeDataModel: unknown = Reflect.get(client, "_runtimeDataModel");
  if (!isRecord(runtimeDataModel) || !isRecord(runtimeDataModel.models)) return false;
  const materialModel = runtimeDataModel.models.Material;
  if (!isRecord(materialModel) || !Array.isArray(materialModel.fields)) return false;

  const fieldNames = materialModel.fields.flatMap((field): string[] =>
    isRecord(field) && typeof field.name === "string" ? [field.name] : [],
  );
  return fieldNames.includes("status") && fieldNames.includes("rejectionReason");
}

function cachedClientHasHigherStudySubmissionFields(client: PrismaClient | undefined) {
  if (!client) return false;

  const runtimeDataModel: unknown = Reflect.get(client, "_runtimeDataModel");
  if (!isRecord(runtimeDataModel) || !isRecord(runtimeDataModel.models)) return false;
  const models = runtimeDataModel.models;

  function getFieldNames(modelName: string) {
    const model = models[modelName];
    if (!isRecord(model) || !Array.isArray(model.fields)) return [];
    return model.fields.flatMap((field): string[] =>
      isRecord(field) && typeof field.name === "string" ? [field.name] : [],
    );
  }

  const userFields = getFieldNames("User");
  const resourceFields = getFieldNames("HigherStudyResource");
  return userFields.includes("higherStudyResources") &&
    resourceFields.includes("userId") &&
    resourceFields.includes("status") &&
    resourceFields.includes("rejectionReason");
}

export const prisma =
  cachedClientHasBtebModels &&
  cachedClientHasHigherStudyModels &&
  cachedClientHasHigherStudySubmissionFields(cachedPrisma) &&
  cachedClientHasMaterialModerationFields(cachedPrisma)
    ? cachedPrisma
    : new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
