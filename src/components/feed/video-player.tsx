"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  src: string;
  poster?: string;
  className?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "auto";
};

export function VideoPlayer({
  src,
  poster,
  className,
  aspectRatio = "16:9",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const aspectClasses = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    auto: "aspect-auto",
  };

  function togglePlay() {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleMouseMove() {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-xl bg-black",
        aspectClasses[aspectRatio],
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        playsInline
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play video"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
            <Play className="size-8 fill-current ml-1" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4 transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div className="mb-3 group/progress">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:size-4"
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Time display */}
          <div className="text-xs text-white/90 font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4 ml-0.5" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
