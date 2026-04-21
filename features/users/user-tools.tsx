"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { cleanupOfflineNodesSchema, renameUserSchema } from "@/lib/forms/schemas";

export function UserTools({
  userId,
  currentName,
  offlineNodeIds
}: {
  userId: string;
  currentName: string;
  offlineNodeIds: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const renameForm = useForm({
    resolver: zodResolver(renameUserSchema),
    defaultValues: { name: currentName }
  });

  const renameMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      apiFetch(`/api/users/${userId}/rename`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      toast.success(t("users.renameToast"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const cleanupMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ removed: number }>(`/api/users/${userId}/cleanup-offline`, {
        method: "POST",
        body: JSON.stringify(cleanupOfflineNodesSchema.parse({ nodeIds: offlineNodeIds }))
      }),
    onSuccess: async (data: { removed: number }) => {
      toast.success(t("users.cleanupToast", { count: data.removed }));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Input {...renameForm.register("name")} />
        <Button onClick={renameForm.handleSubmit((values) => renameMutation.mutate(values))}>{t("users.renameAction")}</Button>
      </div>
      <Button variant="outline" disabled={!offlineNodeIds.length || cleanupMutation.isPending} onClick={() => cleanupMutation.mutate()}>
        {t("users.cleanupAction", { count: offlineNodeIds.length })}
      </Button>
    </div>
  );
}
