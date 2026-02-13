import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LinkPreviewProps = {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  className?: string;
};

export function LinkPreview({
  url,
  title,
  description,
  image_url,
  favicon_url,
  site_name,
  className,
}: LinkPreviewProps) {
  const displayTitle = title || site_name || extractDomain(url);
  const displayImage = image_url;
  const displayFavicon = favicon_url;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("block no-underline", className)}
    >
      <Card className="overflow-hidden border-border/80 hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
        {displayImage && (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={displayImage}
              alt={displayTitle || "Link preview"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 600px, 800px"
            />
          </div>
        )}
        <div className="flex items-start gap-3 p-4">
          {displayFavicon ? (
            <div className="relative size-5 shrink-0 mt-0.5">
              <Image
                src={displayFavicon}
                alt=""
                fill
                className="rounded-sm object-cover"
                sizes="20px"
              />
            </div>
          ) : (
            <Globe className="size-5 text-muted-foreground mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground text-sm line-clamp-1 mb-1">
              {displayTitle}
            </h4>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                {description}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {extractDomain(url)}
              <ExternalLink className="size-3" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function LinkPreviewCompact({
  url,
  title,
  image_url,
  className,
}: Pick<LinkPreviewProps, "url" | "title" | "image_url" | "className">) {
  const displayTitle = title || extractDomain(url);

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-muted/30 hover:border-primary/50 transition-colors group", className)}
    >
      {image_url ? (
        <div className="relative size-12 shrink-0 rounded-lg overflow-hidden">
          <Image
            src={image_url}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="size-12 shrink-0 rounded-lg bg-muted flex items-center justify-center">
          <Globe className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {displayTitle}
        </h4>
        <p className="text-xs text-muted-foreground truncate">{extractDomain(url)}</p>
      </div>
      <ExternalLink className="size-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
    </Link>
  );
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}
