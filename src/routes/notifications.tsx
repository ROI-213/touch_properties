import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Sparkles,
  Building2,
  CheckCheck,
  Phone,
  Trash2,
  X,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePropertyNotifications } from "@/hooks/usePropertyNotifications";
import { resolveLocalImage, FALLBACK_PROPERTY_IMAGE } from "@/data/siteImages";
import { useEnquireModal } from "@/contexts/EnquireModalContext";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = usePropertyNotifications();

  const enquire = useEnquireModal();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [filter, notifications]);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <div className="pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Top Banner / Header */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8962E]">
                  <Sparkles size={15} /> Real Estate Alerts
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  Property Notifications
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Explore newly listed properties, pre-launches, and recent additions.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#B8962E] bg-white px-3.5 py-2 text-xs font-bold text-[#B8962E] hover:bg-[#B8962E] hover:text-white transition shadow-xs"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition shadow-xs"
                  >
                    <Trash2 size={14} /> Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  filter === "all"
                    ? "bg-[#0B2447] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  filter === "unread"
                    ? "bg-[#0B2447] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-medium text-slate-400">
                Loading property alerts…
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 space-y-2">
                <Building2 size={32} className="mx-auto text-slate-300 stroke-[1.5]" />
                <p className="font-semibold text-slate-600">No property notifications available.</p>
                <p className="text-xs text-slate-400">Check back soon for newly published properties!</p>
              </div>
            )}

            {!isLoading &&
              filtered.map((n) => (
                <article
                  key={n.id}
                  className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-300 gap-4 ${
                    !n.isRead
                      ? "border-[#B8962E]/40 bg-amber-50/40 shadow-xs"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <Link
                      to="/property/$slug"
                      params={{ slug: n.slug }}
                      onClick={() => markAsRead(n.id)}
                      className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200"
                    >
                      {n.image_url ? (
                        <img
                          src={resolveLocalImage(n.image_url, FALLBACK_PROPERTY_IMAGE)}
                          alt={n.project_name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_PROPERTY_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-slate-400">
                          <Building2 size={24} />
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-[#B8962E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                          New Property Added
                        </span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#D32F2F] animate-pulse" title="Unread" />
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(n.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg truncate">
                        <Link
                          to="/property/$slug"
                          params={{ slug: n.slug }}
                          onClick={() => markAsRead(n.id)}
                          className="hover:text-[#B8962E] transition-colors"
                        >
                          {n.project_name}
                        </Link>
                      </h3>

                      {n.location_text && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{n.location_text}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-0.5">
                        {n.price_text && (
                          <span className="font-bold text-[#B8962E] text-sm">{n.price_text}</span>
                        )}
                        {n.property_type && (
                          <span className="capitalize rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 border border-slate-200">
                            {n.property_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 self-stretch sm:self-center justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Link
                      to="/property/$slug"
                      params={{ slug: n.slug }}
                      onClick={() => markAsRead(n.id)}
                      className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-xl border border-[#B8962E] px-4 py-2 text-xs font-bold text-[#B8962E] hover:bg-[#B8962E] hover:text-white transition shadow-xs"
                    >
                      View Details <ExternalLink size={13} />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          enquire.open({
                            id: n.property_id,
                            title: n.project_name,
                            location: (n as any).location || "Bangalore",
                            price: n.price_text || "",
                          })
                        }
                        className="grid h-8 w-8 place-items-center rounded-full border border-[#B8962E]/40 text-[#B8962E] hover:bg-[#B8962E] hover:text-white transition shadow-xs"
                        title="Enquire"
                      >
                        <Phone size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => clearNotification(n.id)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition shadow-xs"
                        title="Clear notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NotificationsPage;
