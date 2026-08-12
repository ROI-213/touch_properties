import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Clock, MessageSquare, Calendar, Download, GitCompareArrows, Building2, Home, Trees, Search } from "lucide-react";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useRecentStore } from "@/hooks/useRecentStore";
import { useCompareStore } from "@/hooks/useCompareStore";
import { useDownloadsStore } from "@/hooks/useDownloadsStore";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/customer-dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { profile, user } = useAuth();
  const wishlist = useWishlistStore((s) => s.ids);
  const recent = useRecentStore((s) => s.ids);
  const compare = useCompareStore((s) => s.ids);
  const downloads = useDownloadsStore((s) => s.ids);

  const name = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const { data: enquiries = [] } = useQuery({
    queryKey: ["customer-enquiries", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const visits = enquiries.filter((e: any) => e.requirement_type === 'Site Visit' || e.status === 'Site Visit Scheduled' || e.message?.toLowerCase().includes('site visit'));

  const stats = [
    { label: "Wishlist", value: wishlist.length, icon: Heart, to: "/customer-dashboard/wishlist", color: "from-rose-400 to-rose-600" },
    { label: "Recently Viewed", value: recent.length, icon: Clock, to: "/customer-dashboard/recent", color: "from-amber-400 to-amber-600" },
    { label: "Enquiries", value: enquiries.length, icon: MessageSquare, to: "/customer-dashboard/enquiries", color: "from-sky-400 to-sky-600" },
    { label: "Scheduled Visits", value: visits.length, icon: Calendar, to: "/customer-dashboard/visits", color: "from-emerald-400 to-emerald-600" },
    { label: "Downloads", value: downloads.length, icon: Download, to: "/customer-dashboard/downloads", color: "from-violet-400 to-violet-600" },
    { label: "Compare List", value: compare.length, icon: GitCompareArrows, to: "/customer-dashboard/compare", color: "from-indigo-400 to-indigo-600" },
  ];

  const quick = [
    { label: "Search Properties", icon: Search, to: "/buy-properties/$type", params: { type: "all" } as const },
    { label: "Browse Apartments", icon: Building2, to: "/buy-properties/$type", params: { type: "apartment" } as const },
    { label: "Browse Villas", icon: Home, to: "/buy-properties/$type", params: { type: "villa" } as const },
    { label: "Browse Plots", icon: Trees, to: "/buy-properties/$type", params: { type: "plot" } as const },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[12px] font-bold uppercase tracking-[3px] text-[#C8A34D]">My Dashboard</div>
        <h1 className="mt-1 font-display text-3xl font-bold text-charcoal md:text-4xl">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-[14px] text-charcoal/60">
          Track your saved properties, enquiries, and visits all in one place.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={s.to}
              className="group block overflow-hidden rounded-2xl bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow`}>
                <s.icon size={18} />
              </div>
              <div className="font-display text-3xl font-bold text-charcoal">{s.value}</div>
              <div className="mt-0.5 text-[12.5px] font-medium text-charcoal/60">{s.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold text-charcoal">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quick.map((q) => (
            <Link
              key={q.label}
              to={q.to}
              params={q.params}
              className="flex items-center gap-2 rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-[13px] font-semibold text-charcoal transition hover:-translate-y-0.5 hover:border-[#C8A34D] hover:text-[#C8A34D] hover:shadow-md"
            >
              <q.icon size={15} /> {q.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
