"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { useI18n } from "@/components/shared/i18n-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { createApiKeySchema } from "@/lib/forms/schemas";
import { type HeadscaleApiKey } from "@/lib/headscale/types";
import { formatDateTime } from "@/lib/time";

export function ApiKeysManager({ keys, timeZone }: { keys: HeadscaleApiKey[]; timeZone: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [createdKey, setCreatedKey] = useState<HeadscaleApiKey | null>(null);
  const form = useForm({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { expiration: "" }
  });

  const createMutation = useMutation({
    mutationFn: (payload: { expiration?: string }) =>
      apiFetch<HeadscaleApiKey>("/api/apikeys", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async (result: HeadscaleApiKey) => {
      toast.success(t("apikeys.createdToast"));
      setCreatedKey(result);
      form.reset();
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (prefix: string) => apiFetch<boolean>(`/api/apikeys/${prefix}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success(t("apikeys.deletedToast"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const columns: ColumnDef<HeadscaleApiKey>[] = [
    { accessorKey: "prefix", header: t("apikeys.prefix") },
    {
      accessorKey: "createdAt",
      header: t("apikeys.created"),
      cell: ({ row }) => row.original.createdAt ? formatDateTime(row.original.createdAt, timeZone) : t("common.notAvailable")
    },
    {
      accessorKey: "expiration",
      header: t("apikeys.expiration"),
      cell: ({ row }) => row.original.expiration ? formatDateTime(row.original.expiration, timeZone) : t("apikeys.never")
    },
    {
      id: "actions",
      header: t("apikeys.actions"),
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.original.prefix)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("apikeys.title")} description={t("apikeys.description")} />
      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="expiration">{t("apikeys.expiration")}</Label>
            <Input id="expiration" type="datetime-local" {...form.register("expiration")} />
          </div>
          <Button onClick={form.handleSubmit((values) => createMutation.mutate(values))}>{t("apikeys.createKey")}</Button>
        </CardContent>
      </Card>

      {createdKey?.key ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("apikeys.newKeyTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("apikeys.newKeyDescription")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(createdKey.key!)}>
                <Copy className="mr-2 h-4 w-4" />
                {t("apikeys.copy")}
              </Button>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 font-mono text-sm">{createdKey.key}</div>
            {createdKey.commandHint ? <div className="rounded-2xl border border-border/70 p-4 font-mono text-xs">{createdKey.commandHint}</div> : null}
          </CardContent>
        </Card>
      ) : null}

      <DataTable data={keys} columns={columns} searchPlaceholder={t("apikeys.search")} />
    </div>
  );
}
