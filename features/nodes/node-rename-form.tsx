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
import { renameNodeSchema } from "@/lib/forms/schemas";

export function NodeRenameForm({ id, currentName }: { id: string; currentName: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const form = useForm({
    resolver: zodResolver(renameNodeSchema),
    defaultValues: { name: currentName }
  });

  const mutation = useMutation({
    mutationFn: (payload: { name: string }) => apiFetch(`/api/nodes/${id}/rename`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      toast.success(t("nodes.renamed"));
      await queryClient.invalidateQueries();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <div className="space-y-3">
      <Input {...form.register("name")} />
      {form.formState.errors.name ? <p className="text-sm text-red-600">{form.formState.errors.name.message}</p> : null}
      <Button onClick={form.handleSubmit((values) => mutation.mutate(values))}>{t("common.save")}</Button>
    </div>
  );
}
