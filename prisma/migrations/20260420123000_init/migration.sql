CREATE TABLE "HeadscaleInstance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL DEFAULT 'Default Headscale',
  "serverUrl" TEXT NOT NULL,
  "encryptedApiKey" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastValidatedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "SystemSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "instanceId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SystemSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "HeadscaleInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UiPreference" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  "theme" TEXT NOT NULL DEFAULT 'system',
  "density" TEXT NOT NULL DEFAULT 'comfortable',
  "compactNav" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "AdminAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "instanceId" TEXT,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'owner',
  "oidcSub" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AdminAccount_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "HeadscaleInstance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "instanceId" TEXT,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "detail" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "HeadscaleInstance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SystemSetting_instanceId_key_key" ON "SystemSetting"("instanceId", "key");
CREATE UNIQUE INDEX "AdminAccount_email_key" ON "AdminAccount"("email");
