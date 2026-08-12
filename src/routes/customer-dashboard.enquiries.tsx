import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Calendar, Building, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export const Route = createFileRoute("/customer-dashboard/enquiries")({
  component: EnquiriesPage,
});

function EnquiriesPage() {
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

  return (
    <div>
      <div className="mb-6">
        <div className="text-[12px] font-bold uppercase tracking-[3px] text-[#C8A34D]">My Dashboard</div>
        <h1 className="mt-1 font-display text-3xl font-bold text-charcoal">My Enquiries</h1>
        <p className="mt-1 text-[14px] text-charcoal/60">
          Track the status of your property enquiries and requests.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-charcoal/60 shadow-card">Loading…</div>
      ) : enquiries.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-card">
          <MessageSquare size={40} className="mx-auto mb-3 text-sky-300" />
          <h3 className="font-display text-xl font-semibold text-charcoal">No enquiries yet</h3>
          <p className="mt-1 text-[14px] text-charcoal/60">
            When you contact us about a property, it will appear here.
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
          {enquiries.map((enquiry: any) => (
            <div key={enquiry.id} className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-elevated">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-600">
                      {enquiry.requirement_type || "General Enquiry"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      enquiry.status === "New" ? "bg-amber-50 text-amber-600" :
                      enquiry.status === "In Progress" ? "bg-blue-50 text-blue-600" :
                      "bg-emerald-50 text-emerald-600"
                    }`}>
                      {enquiry.status}
                    </span>
                  </div>
                  {enquiry.property_title && (
                    <h3 className="mt-3 flex items-center gap-2 font-display text-lg font-bold text-charcoal">
                      <Building size={16} className="text-[#C8A34D]" /> {enquiry.property_title}
                    </h3>
                  )}
                  {enquiry.message && (
                    <p className="mt-2 text-[14px] text-charcoal/75">"{enquiry.message}"</p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-[12px] font-medium text-charcoal/50">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {format(new Date(enquiry.created_at), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {format(new Date(enquiry.created_at), "h:mm a")}</span>
                  </div>
                </div>
                {enquiry.page_url && (
                  <a
                    href={enquiry.page_url}
                    className="inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-4 py-2 text-[13px] font-semibold text-charcoal transition hover:border-[#C8A34D] hover:text-[#C8A34D]"
                  >
                    View Source Page
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
