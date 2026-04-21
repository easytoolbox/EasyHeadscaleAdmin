"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { useI18n } from "@/components/shared/i18n-provider";
import { StatusPill } from "@/components/shared/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { type HeadscaleNode, type HeadscaleUser } from "@/lib/headscale/types";
import { NodeRegisterCard } from "@/features/nodes/node-register-card";

export function NodesBatchManager({
  nodes,
  users
}: {
  nodes: HeadscaleNode[];
  users: HeadscaleUser[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [targetUser, setTargetUser] = useState("");
  const [tags, setTags] = useState("");

  const columns: ColumnDef<HeadscaleNode>[] = useMemo(
    () => [
      {
        id: "select",
        header: "",
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selected.includes(row.original.id)}
            onChange={(event) =>
              setSelected((current) =>
                event.target.checked ? [...current, row.original.id] : current.filter((id) => id !== row.original.id)
              )
            }
          />
        )
      },
      {
        accessorKey: "name",
        header: t("nodes.node"),
        cell: ({ row }) => <Link href={`/nodes/${row.original.id}`} className="font-medium hover:underline">{row.original.givenName || row.original.name}</Link>
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
      }
    ],
    [selected, t]
  );

  const batchMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiFetch("/api/nodes/batch", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      toast.success(t("nodes.batchActionCompleted"));
      setSelected([]);
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="space-y-6">
      <NodeRegisterCard users={users} />
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="text-sm text-muted-foreground">{t("nodes.selectedNodes", { count: selected.length })}</div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled={!selected.length} onClick={() => batchMutation.mutate({ action: "delete", nodeIds: selected })}>
              {t("nodes.batchDelete")}
            </Button>
            <Button variant="outline" disabled={!selected.length} onClick={() => batchMutation.mutate({ action: "expire", nodeIds: selected })}>
              {t("nodes.expireSelected")}
            </Button>
            <div className="flex gap-2">
              <select className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={targetUser} onChange={(event) => setTargetUser(event.target.value)}>
                <option value="">{t("nodes.assignToUser")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Button disabled={!selected.length || !targetUser} onClick={() => batchMutation.mutate({ action: "reassign", nodeIds: selected, user: targetUser })}>
                {t("nodes.reassign")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="tag:prod,tag:server" />
              <Button disabled={!selected.length} onClick={() => batchMutation.mutate({ action: "set-tags", nodeIds: selected, tags })}>
                {t("nodes.applyTags")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <DataTable data={nodes} columns={columns} searchPlaceholder={t("nodes.search")} />
    </div>
  );
}
