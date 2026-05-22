"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  tone?: "success" | "info" | "warning";
};

const SEEN_NOTIFICATIONS_KEY = "gymheart_seen_notifications";
const SEEN_NOTIFICATIONS_EVENT = "gymheart-seen-notifications-changed";

function parseSeenNotificationIds(raw: string | null) {
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function subscribeToSeenNotifications(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SEEN_NOTIFICATIONS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SEEN_NOTIFICATIONS_EVENT, onStoreChange);
  };
}

function getSeenNotificationsSnapshot() {
  return window.localStorage.getItem(SEEN_NOTIFICATIONS_KEY) || "[]";
}

function getServerSeenNotificationsSnapshot() {
  return "[]";
}

export function NotificationButton({
  notifications = [],
}: {
  notifications?: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const seenSnapshot = useSyncExternalStore(
    subscribeToSeenNotifications,
    getSeenNotificationsSnapshot,
    getServerSeenNotificationsSnapshot,
  );
  const seenIds = useMemo(() => parseSeenNotificationIds(seenSnapshot), [seenSnapshot]);
  const notificationIds = useMemo(() => notifications.map((item) => item.id), [notifications]);
  const unreadCount = notifications.filter((item) => !seenIds.has(item.id)).length;

  function markCurrentNotificationsSeen(ids: string[]) {
    if (ids.length === 0) return;

    const next = new Set(seenIds);
    for (const id of ids) next.add(id);

    try {
      window.localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(Array.from(next)));
      window.dispatchEvent(new Event(SEEN_NOTIFICATIONS_EVENT));
    } catch {
      // localStorage can be unavailable, but the badge should still clear in this session.
    }
  }

  return (
    <div className="relative">
      <button
        aria-label="Thông báo"
        className="relative inline-flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"
        onClick={() => {
          const nextOpen = !open;
          if (nextOpen) markCurrentNotificationsSeen(notificationIds);
          setOpen(nextOpen);
        }}
        type="button"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-pink-100 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black">Thông báo</h3>
            <button
              aria-label="Đóng thông báo"
              className="text-muted hover:text-primary"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div className="rounded-xl bg-primary-soft p-3" key={item.id}>
                  <p className="flex items-center gap-2 text-sm font-black text-primary">
                    <CheckCircle2 size={16} />
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-primary-soft p-3">
                <p className="flex items-center gap-2 text-sm font-black text-primary">
                  <CheckCircle2 size={16} />
                  Chưa có thông báo mới
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Thanh toán, liên kết ví và trạng thái đăng ký HLV sẽ hiển thị tại đây.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
