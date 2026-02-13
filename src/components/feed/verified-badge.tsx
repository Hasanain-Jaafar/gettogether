import { CheckCircle2, ShieldCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationType = "individual" | "organization" | "government" | null;

type VerifiedBadgeProps = {
  type?: VerificationType;
  size?: "sm" | "default";
  className?: string;
  showText?: boolean;
};

export function VerifiedBadge({
  type = "individual",
  size = "default",
  className,
  showText = false,
}: VerifiedBadgeProps) {
  if (!type) return null;

  const sizeClasses = {
    sm: "size-3.5",
    default: "size-4",
  };

  const icon =
    type === "government" ? (
      <ShieldCheck className={cn(sizeClasses[size], "text-blue-500")} />
    ) : type === "organization" ? (
      <Building2 className={cn(sizeClasses[size], "text-blue-500")} />
    ) : (
      <CheckCircle2 className={cn(sizeClasses[size], "text-blue-500")} />
    );

  if (showText) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400",
          className
        )}
      >
        {icon}
        <span className="capitalize">{type === "organization" ? "Org" : type}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      {icon}
    </span>
  );
}
