"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useI18n } from "@/components/shared/i18n-provider";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useI18n();

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      toast.success(t("auth.logoutSuccess"));
      router.replace("/login");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
      <LogOut className="h-4 w-4" />
      {t("common.logout")}
    </Button>
  );
}
