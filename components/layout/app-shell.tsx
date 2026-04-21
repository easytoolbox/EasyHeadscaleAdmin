import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 md:px-6 xl:px-8">
      <AppSidebar />
      <main className="min-w-0 flex-1">
        <AppHeader />
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}
