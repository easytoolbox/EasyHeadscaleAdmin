"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { useI18n } from "@/components/shared/i18n-provider";
import { PageHeader } from "@/components/shared/page-header";
import { StatusPill } from "@/components/shared/status-pill";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { type HeadscaleNode } from "@/lib/headscale/types";
import { formatDateTime } from "@/lib/time";

export function NodesTable({ nodes, timeZone }: { nodes: HeadscaleNode[]; timeZone: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/nodes/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success(t("nodes.deleted"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const columns: ColumnDef<HeadscaleNode>[] = [
    {
      accessorKey: "name",
      header: t("nodes.node"),
      cell: ({ row }) => (
        <Link href={`/nodes/${row.original.id}`} className="font-medium hover:underline">
          {row.original.givenName || row.original.name}
        </Link>
      )
    },
    {
      accessorKey: "user",
      header: t("nodes.user"),
      cell: ({ row }) => row.original.user?.name ?? t("common.notAvailable")
    },
    {
      accessorKey: "ipAddresses",
      header: t("nodes.addresses"),
      cell: ({ row }) => (row.original.ipAddresses ?? []).join(", ") || t("common.notAvailable")
    },
    {
      accessorKey: "tags",
      header: t("nodes.tags"),
      cell: ({ row }) => (row.original.tags ?? []).join(", ") || t("common.notAvailable")
    },
    {
      accessorKey: "status",
      header: t("nodes.status"),
      cell: ({ row }) => <StatusPill status={row.original.online ? "online" : row.original.expired ? "warning" : "offline"} />
    },
    {
      accessorKey: "lastSeen",
      header: t("nodes.lastSeen"),
      cell: ({ row }) => row.original.lastSeen ? formatDateTime(row.original.lastSeen, timeZone) : t("common.notAvailable")
    },
    {
      id: "actions",
      header: t("nodes.actions"),
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.original.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("nodes.title")} description={t("nodes.description")} />
      <DataTable data={nodes} columns={columns} searchPlaceholder={t("nodes.search")} />
    </div>
  );
}
