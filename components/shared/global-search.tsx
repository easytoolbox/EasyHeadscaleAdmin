"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/components/shared/i18n-provider";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("common.search")}
        className="pl-9"
      />
    </form>
  );
}
