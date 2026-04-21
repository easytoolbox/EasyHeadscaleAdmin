"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { createUserSchema } from "@/lib/forms/schemas";
import { type HeadscaleUser } from "@/lib/headscale/types";
import { formatDateTime } from "@/lib/time";

export function UsersTable({ users, timeZone }: { users: HeadscaleUser[]; timeZone: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "" }
  });

  const columns: ColumnDef<HeadscaleUser>[] = [
    {
      accessorKey: "name",
      header: t("users.name"),
      cell: ({ row }) => <Link href={`/users/${row.original.id}`} className="font-medium hover:underline">{row.original.name}</Link>
    },
    {
      accessorKey: "displayName",
      header: t("users.displayName"),
      cell: ({ row }) => row.original.displayName || t("common.notAvailable")
    },
    {
      accessorKey: "createdAt",
      header: t("users.created"),
      cell: ({ row }) => row.original.createdAt ? formatDateTime(row.original.createdAt, timeZone) : t("common.notAvailable")
    }
  ];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) => apiFetch("/api/users", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      toast.success(t("users.createdToast"));
      form.reset();
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success(t("users.deleted"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("users.title")} description={t("users.description")} />

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="name">{t("users.createUser")}</Label>
            <Input id="name" placeholder="team-alpha" {...form.register("name")} />
            {form.formState.errors.name ? <p className="text-sm text-red-600">{form.formState.errors.name.message}</p> : null}
          </div>
          <Button onClick={form.handleSubmit((values) => createMutation.mutate(values))} disabled={createMutation.isPending}>
            {t("users.createUser")}
          </Button>
        </CardContent>
      </Card>

      <DataTable
        data={users.map((user) => ({ ...user }))}
        columns={[
          ...columns,
          {
            id: "actions",
            header: t("users.actions"),
            cell: ({ row }) => (
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.original.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )
          }
        ]}
        searchPlaceholder={t("users.search")}
      />
    </div>
  );
}
