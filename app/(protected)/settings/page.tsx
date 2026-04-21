import { Globe2, Shield, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusPill } from "@/components/shared/status-pill";
import { SetupForm } from "@/features/settings/setup-form";
import { TimezoneForm } from "@/features/settings/timezone-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/time";
import { getActiveConfigSummary } from "@/server/config-service";
import { getDisplayTimeZone } from "@/server/display-settings-service";
import { getHealthData } from "@/server/headscale-service";

export default async function SettingsPage() {
  const [config, health, timeZone] = await Promise.all([
    getActiveConfigSummary(),
    getHealthData(),
    getDisplayTimeZone().catch(() => "UTC")
  ]);
  const { t } = await getI18n();

  return (
    <div className="space-y-6">
      <PageHeader title={t("settingsPage.title")} description={t("settingsPage.description")} />

      <div className="grid gap-6 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("settingsPage.healthTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("settingsPage.status")}:</span>
              <StatusPill status={health.connected ? "configured" : "error"} />
            </div>
            <p><span className="text-muted-foreground">{t("settingsPage.version")}:</span> {health.version}</p>
            <p><span className="text-muted-foreground">{t("settingsPage.server")}:</span> {health.serverUrl}</p>
            <p><span className="text-muted-foreground">{t("settingsPage.lastValidated")}:</span> {health.lastValidatedAt ? formatDateTime(health.lastValidatedAt, timeZone) : t("common.notAvailable")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5" />
              {t("settingsPage.localSystemTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">{t("settingsPage.app")}:</span> {t("settingsPage.appValue")}</p>
            <p><span className="text-muted-foreground">{t("settingsPage.configStore")}:</span> {t("settingsPage.configStoreValue")}</p>
            <p><span className="text-muted-foreground">{t("settingsPage.mode")}:</span> {t("settingsPage.modeValue")}</p>
            <p><span className="text-muted-foreground">{t("settingsPage.currentInstance")}:</span> {config?.name ?? t("settingsPage.notConfigured")}</p>
          </CardContent>
        </Card>

        <TimezoneForm timeZone={timeZone} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t("settingsPage.extensionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("settingsPage.extensionBody1")}</p>
            <p>{t("settingsPage.extensionBody2")}</p>
          </CardContent>
        </Card>
      </div>

      <SetupForm config={config} embedded />
    </div>
  );
}
