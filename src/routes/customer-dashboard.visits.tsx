import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const Route = createFileRoute("/customer-dashboard/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const { user } = useAuth();
  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["customer-enquiries", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const visits = enquiries.filter((e: any) => e.requirement_type === 'Site Visit' || e.status === 'Site Visit Scheduled' || e.message?.toLowerCase().includes('site visit'));

  return (
    <div>
      <div className="mb-6">
        <div className="text-[12px] font-bold uppercase tracking-[3px] text-[#C8A34D]">My Dashboard</div>
        <h1 className="mt-1 font-display text-3xl font-bold text-charcoal">Scheduled Site Visits</h1>
        <p className="mt-1 text-[14px] text-charcoal/60">
          Track your upcoming and past property visits.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-charcoal/60 shadow-card">Loading…</div>
      ) : visits.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-card">
          <Calendar size={40} className="mx-auto mb-3 text-emerald-300" />
          <h3 className="font-display text-xl font-semibold text-charcoal">No visits scheduled</h3>
          <p className="mt-1 text-[14px] text-charcoal/60">
            You haven't requested any site visits yet.
          </p>
          <Link
            to="/buy-properties/$type"
            params={{ type: "all" }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#C8A34D] to-[#E4C06F] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition hover:-translate-y-0.5"
          >
            Explore Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit: any) => (
            <div key={visit.id} className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-elevated flex flex-col sm:flex-row gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Calendar size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    visit.status === "Site Visit Scheduled" ? "bg-emerald-50 text-emerald-600" :
                    visit.status === "New" ? "bg-amber-50 text-amber-600" :
                    "bg-sky-50 text-sky-600"
                  }`}>
                    {visit.status === "Site Visit Scheduled" ? "Upcoming" : "Requested"}
                  </span>
                </div>
                {visit.property_title && (
                  <h3 className="mt-2 font-display text-xl font-bold text-charcoal">{visit.property_title}</h3>
                )}
                {visit.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-[13px] text-charcoal/70">
                    <MapPin size={14} /> {visit.location}
                  </div>
                )}
                {visit.message && (
                  <p className="mt-2 text-[14px] text-charcoal/75">"{visit.message}"</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-[12px] font-medium text-charcoal/50">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> Requested on {format(new Date(visit.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>
              {visit.page_url && (
                <div className="sm:self-start">
                  <a
                    href={visit.page_url}
                    className="inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-4 py-2 text-[13px] font-semibold text-charcoal transition hover:border-[#C8A34D] hover:text-[#C8A34D]"
                  >
                    View Property
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
