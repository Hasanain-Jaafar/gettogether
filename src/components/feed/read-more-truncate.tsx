"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReadMoreTruncateProps = {
  text: string;
  maxLength?: number;
  className?: string;
};

export function ReadMoreTruncate({
  text,
  maxLength = 300,
  className,
}: ReadMoreTruncateProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= maxLength) {
    return (
      <p className={cn("whitespace-pre-wrap wrap-break-word text-foreground", className)}>
        {text}
      </p>
    );
  }

  return (
    <>
      <p className={cn("whitespace-pre-wrap wrap-break-word text-foreground", className)}>
        {expanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      {!expanded && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-primary hover:bg-transparent"
          onClick={() => setExpanded(true)}
        >
          Read more
        </Button>
      )}
    </>
  );
}
