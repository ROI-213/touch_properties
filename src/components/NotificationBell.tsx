import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Sparkles, Building2, Trash2, X, ChevronRight, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePropertyNotifications, type NotificationItem } from "@/hooks/usePropertyNotifications";
import { resolveLocalImage, FALLBACK_PROPERTY_IMAGE } from "@/data/siteImages";

function timeAgo(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    if (isNaN(diffInMs)) return "Recently";

    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    if (diffInMins < 2) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = usePropertyNotifications({ deep: open });

  // Format badge count: 99+ if > 99
  const badgeDisplay = unreadCount > 99 ? "99+" : unreadCount;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelectNotification = (n: NotificationItem) => {
    markAsRead(n.id);
    setOpen(false);
    navigate({ to: "/property/$slug", params: { slug: n.slug } });
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Icon Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        className="relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-white text-slate-700 shadow-sm border border-slate-200/80 transition-all duration-200 hover:border-slate-300 hover:shadow-md active:scale-95"
      >
        <Bell size={19} className={unreadCount > 0 ? "text-[#B8962E] fill-[#B8962E]/15" : "text-slate-600"} />

        {/* Badge */}
        <AnimatePresence mode="wait">
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#D32F2F] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white shadow-md"
            >
              {badgeDisplay}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3 top-20 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[#B8962E]" />
                <h3 className="font-display text-sm font-bold text-slate-900">New Properties</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#B8962E]/15 px-2 py-0.5 text-[10px] font-bold text-[#B8962E]">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-200/60 hover:text-[#B8962E] transition"
                  >
                    <CheckCheck size={13} />
                    <span className="hidden xs:inline">Mark read</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    title="Clear all notifications"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 transition"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {isLoading && (
                <div className="p-8 text-center text-xs font-medium text-slate-400">
                  Checking new property alerts…
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="p-10 text-center text-slate-400 space-y-1">
                  <Building2 size={28} className="mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">No new property notifications.</p>
                  <p className="text-[11px] text-slate-400">New additions from our catalog will appear here.</p>
                </div>
              )}

              {!isLoading &&
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`group relative flex items-start gap-3 p-3.5 transition-colors hover:bg-slate-50/90 ${
                      !n.isRead ? "bg-amber-50/40" : "bg-white"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => handleSelectNotification(n)}
                      className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-slate-100 border border-slate-200/80"
                    >
                      {n.image_url ? (
                        <img
                          src={resolveLocalImage(n.image_url, FALLBACK_PROPERTY_IMAGE)}
                          alt={n.project_name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_PROPERTY_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-400">
                          <Building2 size={20} />
                        </div>
                      )}
                    </div>

                    {/* Info Body */}
                    <div
                      onClick={() => handleSelectNotification(n)}
                      className="flex-1 min-w-0 cursor-pointer pr-5"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#B8962E] bg-[#B8962E]/10 px-1.5 py-0.5 rounded">
                          New Property Added
                        </span>
                        <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#B8962E] transition-colors">
                        {n.project_name}
                      </h4>

                      {n.location_text && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{n.location_text}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        {n.price_text && (
                          <span className="font-bold text-slate-800">{n.price_text}</span>
                        )}
                        {n.property_type && (
                          <span className="capitalize rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200/60">
                            {n.property_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right action controls */}
                    <div className="absolute right-2 top-3 flex flex-col items-center gap-2">
                      {/* Unread indicator dot */}
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#D32F2F] shadow-xs" title="Unread" />
                      )}

                      {/* Clear item button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(n.id);
                        }}
                        title="Clear notification"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 rounded"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Dropdown Footer */}
            <div className="border-t border-slate-100 bg-slate-50/80 p-2 text-center">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#B8962E] hover:text-[#9A7B22] hover:underline py-1 px-3 transition"
              >
                View all notifications <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
