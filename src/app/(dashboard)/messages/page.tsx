import { MessageSquare, Heart } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <MessageSquare className="size-10 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-3">Messages Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        Private messaging is on its way! Connect directly with the people you
        meet and build meaningful relationships one conversation at a time.
      </p>
      <div className="mt-8 p-4 rounded-xl border bg-muted/30 flex items-center gap-3">
        <Heart className="size-5 text-primary" />
        <p className="text-sm">
          In the meantime, engage with posts through likes and comments to start
          connecting!
        </p>
      </div>
    </div>
  );
}
