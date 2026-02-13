import { useState, useEffect } from "react";

type OnlineStatus = "online" | "offline";

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<OnlineStatus>(() => {
    if (typeof navigator !== "undefined") {
      return navigator.onLine ? "online" : "offline";
    }
    return "online";
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline("online");
    const handleOffline = () => setIsOnline("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
