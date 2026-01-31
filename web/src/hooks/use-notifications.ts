import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

async function fetchNotifications(
  unreadOnly = false
): Promise<NotificationsResponse> {
  const url = unreadOnly
    ? "/api/v1/notifications?unread=true"
    : "/api/v1/notifications";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

async function markAsRead(id: string): Promise<Notification> {
  const res = await fetch(`/api/v1/notifications/${id}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
}

async function markAllAsRead(): Promise<void> {
  const res = await fetch("/api/v1/notifications/read-all", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: () => fetchNotifications(unreadOnly),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60000, // Refetch every minute (reduced from 30s)
    refetchOnMount: false,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Browser notification helpers
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return Promise.resolve("denied");
  }
  return Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
) {
  if (!("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  const notification = new Notification(title, {
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    ...options,
  });

  if (options?.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
}

// Hook to manage browser notifications with auto-request permission
export function useBrowserNotifications() {
  useEffect(() => {
    // Request permission on mount if not already granted/denied
    if ("Notification" in window && Notification.permission === "default") {
      // Delay to not be intrusive
      const timer = setTimeout(() => {
        requestNotificationPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions & { onClick?: () => void }) => {
      return showBrowserNotification(title, options);
    },
    []
  );

  return {
    notify,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    permission: typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied",
  };
}
