"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Topic = {
  id: string;
  name: string;
};

type TopicFilterBarProps = {
  topics: Topic[];
  className?: string;
};

export function TopicFilterBar({ topics, className }: TopicFilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTopic = searchParams.get("topic");

  const setTopic = (topicId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (topicId) {
      params.set("topic", topicId);
    } else {
      params.delete("topic");
    }
    router.push(`?${params.toString()}`);
  };

  const currentTopicData = topics.find((t) => t.id === currentTopic);

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!currentTopic ? "default" : "outline"}
            size="sm"
            onClick={() => setTopic(null)}
            className="rounded-full shrink-0"
          >
            All
          </Button>
          {topics.map((topic) => (
            <Button
              key={topic.id}
              variant={currentTopic === topic.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTopic(topic.id)}
              className="rounded-full shrink-0"
            >
              #{topic.name}
            </Button>
          ))}
        </div>
        {currentTopicData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTopic(null)}
            className="rounded-full shrink-0"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
