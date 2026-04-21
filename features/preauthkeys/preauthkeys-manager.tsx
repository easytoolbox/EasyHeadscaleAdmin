"use client";

import { Copy, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { useI18n } from "@/components/shared/i18n-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { createPreAuthKeySchema } from "@/lib/forms/schemas";
import { type HeadscalePreAuthKey, type HeadscaleUser } from "@/lib/headscale/types";
import { formatDateTime } from "@/lib/time";
import { maskSecret } from "@/lib/utils";

export function PreAuthKeysManager({
  keys,
  users,
  timeZone
}: {
  keys: HeadscalePreAuthKey[];
  users: HeadscaleUser[];
  timeZone: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createPreAuthKeySchema),
    defaultValues: {
      user: "",
      reusable: false,
      ephemeral: false,
      expiration: "1h",
      aclTags: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<HeadscalePreAuthKey>("/api/preauthkeys", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async (result: HeadscalePreAuthKey) => {
      toast.success(t("preauthkeys.createdToast"));
      setCreatedKey(result.key ?? null);
      form.reset();
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<{ status: "expired" | "removed" }>(`/api/preauthkeys/${id}`, { method: "DELETE" }),
    onSuccess: async (result) => {
      toast.success(result.status === "removed" ? t("preauthkeys.deletedToast") : t("preauthkeys.expiredToast"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const columns: ColumnDef<HeadscalePreAuthKey>[] = [
    { accessorKey: "id", header: t("preauthkeys.id") },
    {
      accessorKey: "key",
      header: t("preauthkeys.keyPreview"),
      cell: ({ row }) => row.original.key ? maskSecret(row.original.key) : t("common.notAvailable")
    },
    {
      accessorKey: "user",
      header: t("preauthkeys.user"),
      cell: ({ row }) => row.original.user?.name ?? t("preauthkeys.global")
    },
    {
      accessorKey: "flags",
      header: t("preauthkeys.flags"),
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.reusable ? <Badge variant="success">{t("preauthkeys.reusable")}</Badge> : null}
          {row.original.ephemeral ? <Badge variant="warning">{t("preauthkeys.ephemeral")}</Badge> : null}
          {row.original.expired ? <Badge variant="destructive">{t("preauthkeys.expired")}</Badge> : null}
          {row.original.used ? <Badge variant="outline">{t("preauthkeys.used")}</Badge> : null}
        </div>
      )
    },
    {
      accessorKey: "expiration",
      header: t("preauthkeys.expiration"),
      cell: ({ row }) => row.original.expiration ? formatDateTime(row.original.expiration, timeZone) : t("preauthkeys.never")
    },
    {
      id: "actions",
      header: t("preauthkeys.actions"),
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.original.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("preauthkeys.title")} description={t("preauthkeys.description")} />

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="pak-user">{t("preauthkeys.userOptional")}</Label>
            <select
              id="pak-user"
              {...form.register("user")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">{t("preauthkeys.global")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.displayName ? `${user.displayName} (${user.name})` : user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pak-expiration">{t("preauthkeys.expiration")}</Label>
            <select
              id="pak-expiration"
              {...form.register("expiration")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="1h">{t("preauthkeys.expiration1h")}</option>
              <option value="6h">{t("preauthkeys.expiration6h")}</option>
              <option value="12h">{t("preauthkeys.expiration12h")}</option>
              <option value="24h">{t("preauthkeys.expiration24h")}</option>
              <option value="never">{t("preauthkeys.expirationNever")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pak-tags">{t("preauthkeys.aclTags")}</Label>
            <Input id="pak-tags" placeholder="tag:server,tag:prod" {...form.register("aclTags")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("reusable")} />
            {t("preauthkeys.reusable")}
          </label>
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("ephemeral")} />
              {t("preauthkeys.ephemeral")}
            </label>
            <Button onClick={form.handleSubmit((values) => createMutation.mutate(values))}>{t("preauthkeys.createKey")}</Button>
          </div>
        </CardContent>
      </Card>

      {createdKey ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("preauthkeys.newKeyTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("preauthkeys.newKeyDescription")}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(createdKey)}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t("preauthkeys.copy")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.message(createdKey)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  {t("preauthkeys.show")}
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 font-mono text-sm">{createdKey}</div>
          </CardContent>
        </Card>
      ) : null}

      <DataTable data={keys} columns={columns} searchPlaceholder={t("preauthkeys.search")} />
    </div>
  );
}
