import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    email?: string;
    user_metadata?: { name?: string; full_name?: string };
  } | null;
  profile?: { name?: string | null; avatar_url?: string | null } | null;
};

export function DashboardShell({
  children,
  user,
  profile,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} profile={profile} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
