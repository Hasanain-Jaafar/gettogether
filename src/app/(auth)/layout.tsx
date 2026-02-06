export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Soft pink gradient overlay to match reference */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/12%,transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/20%,transparent)]" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
