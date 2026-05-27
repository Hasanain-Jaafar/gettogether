"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQ);

  useEffect(() => {
    setValue(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.replace(qs ? `/explore?${qs}` : "/explore");
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search people, posts, hashtags…"
        className="pl-10 pr-10 rounded-full h-11"
        autoFocus
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setValue("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8 rounded-full"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
