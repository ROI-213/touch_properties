import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, X, Upload, Loader2, MessageCircle, StickyNote, Phone } from "lucide-react";
import { listBuilders, upsertBuilder, deleteBuilder } from "@/lib/admin-properties";
import { uploadStorageMedia } from "@/lib/site-cms";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/builders")({
  component: BuildersPage,
});

const CONTACT_TYPES = [
  { value: "builder", label: "Builder" },
  { value: "developer", label: "Developer" },
  { value: "agent", label: "Agent" },
  { value: "owner", label: "Owner" },
  { value: "channel_partner", label: "Channel Partner" },
  { value: "land_owner", label: "Land Owner" },
  { value: "individual_seller", label: "Individual Seller" },
];
const typeLabel = (t: string) => CONTACT_TYPES.find((c) => c.value === t)?.label || t || "Builder";

const FILTERS = [{ value: "all", label: "All" }, ...CONTACT_TYPES];

function formatDateOnly(val: any): string {
  if (!val) return "";
  return String(val).slice(0, 10);
}

function BuildersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-builders"], queryFn: listBuilders });
  const allNotes = useQuery({
    queryKey: ["contact-notes-all"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("contact_notes" as any)
        .select("*, properties(project_name)")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[admin.builders] contact_notes load failed:", error.message);
        return [];
      }
      return (rows ?? []) as any[];
    },
  });

  const notesByContact = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const n of allNotes.data ?? []) {
      if (!n?.contact_id) continue;
      const arr = map.get(n.contact_id) ?? [];
      arr.push(n);
      map.set(n.contact_id, arr);
    }
    return map;
  }, [allNotes.data]);

  const [editing, setEditing] = useState<any | null>(null);
  const [initialTab, setInitialTab] = useState<TabKey>("details");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((b: any) => {
      const t = b.contact_type ?? "builder";
      if (filter !== "all" && t !== filter) return false;
      if (!q) return true;
      return [b.name, b.display_name, b.email, b.primary_phone, b.whatsapp_number]
        .some((x: any) => (x ?? "").toString().toLowerCase().includes(q));
    });
  }, [data, filter, search]);

  const save = useMutation({
    mutationFn: upsertBuilder,
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-builders"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: deleteBuilder,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-builders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openModal = (contact: any, tab: TabKey = "details") => {
    setInitialTab(tab);
    setEditing(contact);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0a1f44]">Builders / Agents / Owners</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">{filtered.length} of {data?.length ?? 0} contacts</p>
        </div>
        <button onClick={() => openModal({}, "details")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#c9a961] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#b89651]">
          <Plus size={15} /> Add Contact
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f.value ? "bg-[#0a1f44] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {f.label}
          </button>
        ))}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email…"
          className="w-full sm:ml-auto sm:w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a961]" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3">Logo</th><th className="p-3">Name</th><th className="p-3">Type</th>
              <th className="p-3">Phone</th><th className="p-3">WhatsApp</th><th className="p-3">Email</th>
              <th className="p-3">Active</th><th className="p-3">Public</th><th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="p-8 text-center text-slate-400">Loading…</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-400">No contacts.</td></tr>}
            {filtered.map((b: any) => {
              const contactNotes = notesByContact.get(b.id) ?? [];
              return (
                <Fragment key={b.id}>
                  <tr className="border-t border-slate-100">
                    <td className="p-3">{b.logo_url ? <img src={b.logo_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-slate-100" />}</td>
                    <td className="p-3 font-medium text-[#0a1f44]">{b.display_name || b.name}</td>
                    <td className="p-3 text-xs text-slate-500">{typeLabel(b.contact_type)}</td>
                    <td className="p-3 text-xs text-slate-500">{b.primary_phone || "—"}</td>
                    <td className="p-3 text-xs text-slate-500">{b.whatsapp_number || "—"}</td>
                    <td className="p-3 text-xs text-slate-500">{b.email || "—"}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] ${b.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{b.active ? "Active" : "Inactive"}</span></td>
                    <td className="p-3 text-xs">{b.show_on_website === false ? "Hidden" : "Shown"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openModal(b, "notes")}
                        className="mr-1.5 inline-flex items-center gap-1 rounded-md border border-[#c9a961]/40 bg-[#c9a961]/10 px-2.5 py-1 text-xs font-semibold text-[#0a1f44] hover:bg-[#c9a961]/20"
                        title="Admin Notes"
                      >
                        <StickyNote size={13} className="text-[#c9a961]" />
                        <span>Notes{contactNotes.length > 0 ? ` (${contactNotes.length})` : ""}</span>
                      </button>
                      <button onClick={() => openModal(b, "details")} className="mr-1 inline-grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => { if (confirm(`Delete ${b.name}?`)) del.mutate(b.id); }} className="inline-grid h-8 w-8 place-items-center rounded-md text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                  {contactNotes.length > 0 && (
                    <tr className="bg-amber-50/40 border-t border-amber-100/80">
                      <td colSpan={9} className="px-4 py-2.5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0a1f44]">
                              <StickyNote size={12} className="text-[#c9a961]" />
                              Admin Notes ({contactNotes.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => openModal(b, "notes")}
                              className="text-[11px] font-semibold text-[#c9a961] hover:underline"
                            >
                              + Add / Manage Notes
                            </button>
                          </div>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {contactNotes.map((n: any) => (
                              <div key={n.id} className="rounded-lg border border-amber-200/70 bg-white px-3 py-2 text-xs shadow-2xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold text-[#0a1f44]">
                                    {n.note_title ? `${n.note_title}: ` : ""}
                                    <span className="font-normal text-slate-700">{n.note_description}</span>
                                  </div>
                                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    {n.note_type || "Note"}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                  <span>Status: {n.status}</span>
                                  <span>· Priority: {n.priority}</span>
                                  {n.follow_up_date && (
                                    <span className="text-amber-700 font-medium">
                                      · Follow-up: {formatDateOnly(n.follow_up_date)} {n.follow_up_time ? String(n.follow_up_time).slice(0, 5) : ""}
                                    </span>
                                  )}
                                  {n.properties?.project_name && (
                                    <span className="text-blue-700 font-medium">· {n.properties.project_name}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
        {isLoading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Loading…</div>}
        {!isLoading && filtered.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No contacts.</div>}
        {filtered.map((b: any) => {
          const contactNotes = notesByContact.get(b.id) ?? [];
          return (
            <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-100" />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-[#0a1f44]">
                      {(b.display_name || b.name || "B").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#0a1f44]">{b.display_name || b.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {typeLabel(b.contact_type)}{b.primary_phone ? ` · ${b.primary_phone}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => openModal(b, "notes")}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#c9a961]/40 bg-[#c9a961]/10 px-2.5 text-xs font-semibold text-[#0a1f44]"
                    title="Admin Notes"
                  >
                    <StickyNote size={13} className="text-[#c9a961]" />
                    <span>{contactNotes.length}</span>
                  </button>
                  <button onClick={() => openModal(b, "details")} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => { if (confirm(`Delete ${b.name}?`)) del.mutate(b.id); }} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              {contactNotes.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-100 pt-2">
                  {contactNotes.map((n: any) => (
                    <div key={n.id} className="rounded-lg bg-amber-50/60 border border-amber-200/60 px-2.5 py-1.5 text-xs">
                      <span className="font-semibold text-[#0a1f44]">{n.note_title ? `${n.note_title}: ` : ""}</span>
                      <span className="text-slate-700">{n.note_description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <ContactModal
          initial={editing}
          initialTab={initialTab}
          onClose={() => setEditing(null)}
          onSave={(v) => save.mutate(v)}
          submitting={save.isPending}
        />
      )}
    </div>
  );
}

// ============================================================
// Modal with tabs: Details / Contact / Settings / Notes
// ============================================================
type TabKey = "details" | "contact" | "settings" | "notes";
function ContactModal({ initial, initialTab = "details", onClose, onSave, submitting }: {
  initial: any; initialTab?: TabKey; onClose: () => void; onSave: (v: any) => void; submitting: boolean;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [v, setV] = useState<any>({
    name: "", display_name: "", contact_type: "builder", website: "", logo_url: "",
    description: "", display_order: 0, active: true, show_on_website: true,
    primary_phone: "", whatsapp_number: "", alternative_phone: "", email: "",
    alternative_email: "", office_address: "", city: "", locality: "",
    preferred_contact_method: "", contact_person_name: "", designation: "",
    rera_prefix: "", ...initial,
  });
  const set = (k: string, val: any) => setV((s: any) => ({ ...s, [k]: val }));

  const ensureSavedContact = async (): Promise<any> => {
    if (v.id) return v;
    if (!v.name?.trim()) {
      throw new Error("Please enter Name / Company Name in the Details tab first.");
    }
    const created = await upsertBuilder(v);
    setV((prev: any) => ({ ...prev, ...created }));
    qc.invalidateQueries({ queryKey: ["admin-builders"] });
    return created;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/50 p-3 sm:p-4" onClick={onClose}>
      <div className="my-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="font-display text-base sm:text-lg font-semibold text-[#0a1f44]">{v?.id ? "Edit Contact" : "New Contact"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 sm:px-4">
          {(["details","contact","settings","notes"] as TabKey[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative whitespace-nowrap px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium capitalize ${tab === t ? "text-[#0a1f44]" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "notes" ? "Admin Notes" : t}
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-[#c9a961]" />}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {tab === "details" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <F label="Contact Type *">
                <select className={inp} value={v.contact_type} onChange={(e) => set("contact_type", e.target.value)}>
                  {CONTACT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </F>
              <F label="Name / Company Name *"><input className={inp} value={v.name} onChange={(e) => set("name", e.target.value)} /></F>
              <F label="Display Name"><input className={inp} value={v.display_name || ""} onChange={(e) => set("display_name", e.target.value)} placeholder="Shown on the site" /></F>
              <F label="Website"><input className={inp} value={v.website || ""} onChange={(e) => set("website", e.target.value)} /></F>
              <F label="RERA Prefix / Number"><input className={inp} value={v.rera_prefix || ""} onChange={(e) => set("rera_prefix", e.target.value)} /></F>
              <F label="Display Order"><input type="number" className={inp} value={v.display_order ?? 0} onChange={(e) => set("display_order", Number(e.target.value) || 0)} /></F>
              <div className="md:col-span-2"><LogoUploader value={v.logo_url || ""} onChange={(url) => set("logo_url", url)} /></div>
              <F label="Description" full>
                <textarea rows={3} className={inp} value={v.description || ""} onChange={(e) => set("description", e.target.value)} />
              </F>
            </div>
          )}

          {tab === "contact" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <F label="Primary Phone"><input className={inp} value={v.primary_phone || ""} onChange={(e) => set("primary_phone", e.target.value)} placeholder="+91…" /></F>
              <F label="WhatsApp Number"><input className={inp} value={v.whatsapp_number || ""} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="+91…" /></F>
              <F label="Alternative Phone"><input className={inp} value={v.alternative_phone || ""} onChange={(e) => set("alternative_phone", e.target.value)} /></F>
              <F label="Email"><input type="email" className={inp} value={v.email || ""} onChange={(e) => set("email", e.target.value)} /></F>
              <F label="Alternative Email"><input type="email" className={inp} value={v.alternative_email || ""} onChange={(e) => set("alternative_email", e.target.value)} /></F>
              <F label="Preferred Contact Method">
                <select className={inp} value={v.preferred_contact_method || ""} onChange={(e) => set("preferred_contact_method", e.target.value)}>
                  <option value="">—</option>
                  {["Phone","WhatsApp","Email","Any"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </F>
              <F label="Office Address" full><textarea rows={2} className={inp} value={v.office_address || ""} onChange={(e) => set("office_address", e.target.value)} /></F>
              <F label="City"><input className={inp} value={v.city || ""} onChange={(e) => set("city", e.target.value)} /></F>
              <F label="Locality / Area"><input className={inp} value={v.locality || ""} onChange={(e) => set("locality", e.target.value)} /></F>
              <F label="Contact Person Name"><input className={inp} value={v.contact_person_name || ""} onChange={(e) => set("contact_person_name", e.target.value)} /></F>
              <F label="Designation"><input className={inp} value={v.designation || ""} onChange={(e) => set("designation", e.target.value)} placeholder="Sales Manager, Owner…" /></F>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-[#c9a961]" /> Active</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.show_on_website !== false} onChange={(e) => set("show_on_website", e.target.checked)} className="h-4 w-4 accent-[#c9a961]" /> Show on public website</label>
              <p className="text-xs text-slate-500">Hidden contacts remain available in the admin property form dropdowns but do not appear anywhere public.</p>
            </div>
          )}

          {tab === "notes" && <NotesPanel contact={v} ensureSavedContact={ensureSavedContact} />}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          <button disabled={submitting || !v.name?.trim()} onClick={() => onSave(v)}
            className="rounded-md bg-[#c9a961] px-4 py-2 text-sm font-medium text-white hover:bg-[#b89651] disabled:opacity-50">
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Notes Panel
// ============================================================
const NOTE_TYPES = ["Site Visit","Interested","Not Interested","Follow Up","Price Discussion","Document Pending","Payment Discussion","Call Back","Meeting Scheduled","Property Discussion","Other"];
const PRIORITIES = ["low","medium","high","urgent"];
const STATUSES = ["open","in_progress","completed","cancelled"];

function NotesPanel({ contact, ensureSavedContact }: { contact: any; ensureSavedContact: () => Promise<any> }) {
  const qc = useQueryClient();
  const notes = useQuery({
    queryKey: ["contact-notes", contact.id],
    enabled: Boolean(contact.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_notes" as any)
        .select("*, properties(project_name)")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const properties = useQuery({
    queryKey: ["notes-property-picker"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, project_name").order("project_name");
      return (data ?? []) as any[];
    },
  });

  const emptyDraft = { id: null as string | null, note_title: "", note_description: "", note_type: "Follow Up", property_id: "", follow_up_date: "", follow_up_time: "", priority: "medium", status: "open" };
  const [draft, setDraft] = useState<any>(emptyDraft);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const create = useMutation({
    mutationFn: async () => {
      const desc = (draft.note_description || "").trim() || (draft.note_title || "").trim();
      if (!desc) throw new Error("Please enter a note description or title");
      const savedContact = await ensureSavedContact();
      const auth = (await supabase.auth.getUser()).data.user;
      const payload: any = {
        note_title: (draft.note_title || "").trim(),
        note_description: desc,
        note_type: draft.note_type,
        priority: draft.priority,
        status: draft.status,
        contact_id: savedContact.id,
        property_id: draft.property_id || null,
        follow_up_date: draft.follow_up_date || null,
        follow_up_time: draft.follow_up_time || null,
      };
      if (draft.id) {
        payload.updated_by = auth?.id ?? null;
        const { data: updatedRow, error } = await supabase
          .from("contact_notes" as any)
          .update(payload)
          .eq("id", draft.id)
          .select("*, properties(project_name)")
          .single();
        if (error) throw error;
        return { row: updatedRow, contactId: savedContact.id, isUpdate: true };
      } else {
        payload.created_by = auth?.id ?? null;
        const { data: insertedRow, error } = await supabase
          .from("contact_notes" as any)
          .insert(payload)
          .select("*, properties(project_name)")
          .single();
        if (error) throw error;
        return { row: insertedRow, contactId: savedContact.id, isUpdate: false };
      }
    },
    onSuccess: ({ row, contactId, isUpdate }) => {
      toast.success(isUpdate ? "Note updated" : "Note added");
      setDraft(emptyDraft);
      setFilterStatus("all");
      if (row) {
        qc.setQueryData(["contact-notes", contactId], (old: any[] | undefined) => {
          const prev = Array.isArray(old) ? old : [];
          if (isUpdate) {
            return prev.map((item) => (item.id === row.id ? row : item));
          }
          return [row, ...prev.filter((item) => item.id !== row.id)];
        });
      }
      qc.invalidateQueries({ queryKey: ["contact-notes", contactId] });
      qc.invalidateQueries({ queryKey: ["contact-notes-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_notes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["contact-notes", contact.id] });
      qc.invalidateQueries({ queryKey: ["contact-notes-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_notes" as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-notes", contact.id] });
      qc.invalidateQueries({ queryKey: ["contact-notes-all"] });
    },
  });

  const buildMessage = (note: any) => {
    const name = contact.display_name || contact.name || "there";
    const property = note.properties?.project_name;
    return [
      `Hello ${name},`,
      "",
      ...(property ? [`Regarding: ${property}`, ""] : []),
      `Note: ${note.note_description}`,
      "",
      ...(note.follow_up_date ? [`Follow-up Date: ${formatDateOnly(note.follow_up_date)}${note.follow_up_time ? ` ${String(note.follow_up_time).slice(0, 5)}` : ""}`] : []),
      `Status: ${note.status}`,
      "",
      "Regards,",
      "Touch Stone Properties",
    ].join("\n");
  };

  const sendWhatsApp = (note: any) => {
    let num = (contact.whatsapp_number || "").replace(/\D/g, "");
    if (!num) { toast.error("WhatsApp number is not added for this contact."); return; }
    if (num.length === 10) num = `91${num}`;
    const url = `https://wa.me/${num}?text=${encodeURIComponent(buildMessage(note))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const callContact = () => {
    const phone = (contact.primary_phone || contact.phone || "").replace(/[^\d+]/g, "");
    if (!phone) { toast.error("Phone number is not added for this contact."); return; }
    window.location.href = `tel:${phone}`;
  };

  const list = (notes.data ?? []).filter((n) => filterStatus === "all" || n.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#0a1f44]"><StickyNote size={14} /> {draft.id ? "Edit Note" : "Add Note"}</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input className={inp} placeholder="Title (optional)" value={draft.note_title} onChange={(e) => setDraft({ ...draft, note_title: e.target.value })} />
          <select className={inp} value={draft.note_type} onChange={(e) => setDraft({ ...draft, note_type: e.target.value })}>
            {NOTE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <textarea className={`${inp} md:col-span-2`} rows={2} placeholder="Description *" value={draft.note_description} onChange={(e) => setDraft({ ...draft, note_description: e.target.value })} />
          <select className={inp} value={draft.property_id} onChange={(e) => setDraft({ ...draft, property_id: e.target.value })}>
            <option value="">— Related property (optional) —</option>
            {(properties.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className={inp} value={draft.follow_up_date} onChange={(e) => setDraft({ ...draft, follow_up_date: e.target.value })} />
            <input type="time" className={inp} value={draft.follow_up_time} onChange={(e) => setDraft({ ...draft, follow_up_time: e.target.value })} />
          </div>
          <select className={inp} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={inp} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={create.isPending} onClick={() => create.mutate()}
            className="rounded-md bg-[#0a1f44] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0a1f44]/90 disabled:opacity-50">
            {create.isPending ? "Saving…" : draft.id ? "Update Note" : "Add Note"}
          </button>
          {draft.id && (
            <button type="button" onClick={() => setDraft(emptyDraft)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              Cancel edit
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#0a1f44]">Saved Notes ({list.length}):</span>
          {["all", ...STATUSES].map((s) => (
            <button type="button" key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-full px-2 py-0.5 text-[11px] ${filterStatus === s ? "bg-[#0a1f44] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {s.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {notes.isLoading && <p className="text-sm text-slate-400">Loading notes…</p>}
        {!notes.isLoading && list.length === 0 && <p className="text-sm text-slate-400">No notes yet. Add a note above and it will display right here.</p>}
        {list.map((n) => (
          <div key={n.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {n.note_title && <p className="font-semibold text-[#0a1f44]">{n.note_title}</p>}
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.note_description}</p>
                <p className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">{n.note_type || "—"}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">Priority: {n.priority}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">Status: {n.status}</span>
                  {n.follow_up_date && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 font-medium">
                      Follow-up: {formatDateOnly(n.follow_up_date)} {n.follow_up_time ? String(n.follow_up_time).slice(0, 5) : ""}
                    </span>
                  )}
                  {n.properties?.project_name && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 font-medium">{n.properties.project_name}</span>}
                  <span>· {new Date(n.created_at).toLocaleString()}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <button type="button" onClick={() => sendWhatsApp(n)} title="Send on WhatsApp"
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-100">
                  <MessageCircle size={12} /> WhatsApp
                </button>
                {(contact.primary_phone || contact.phone) && (
                  <button type="button" onClick={callContact} title="Call contact"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-200">
                    <Phone size={12} /> Call
                  </button>
                )}
                {n.status !== "completed" && (
                  <button type="button" onClick={() => setStatus.mutate({ id: n.id, status: "completed" })}
                    className="rounded-md bg-slate-100 px-2 py-1 text-[11px] hover:bg-slate-200">Mark done</button>
                )}
                <button type="button" onClick={() => setDraft({
                  id: n.id, note_title: n.note_title ?? "", note_description: n.note_description ?? "",
                  note_type: n.note_type ?? "Follow Up", property_id: n.property_id ?? "",
                  follow_up_date: formatDateOnly(n.follow_up_date), follow_up_time: (n.follow_up_time ?? "").toString().slice(0,5),
                  priority: n.priority ?? "medium", status: n.status ?? "open",
                })} title="Edit note"
                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-100">
                  <Edit2 size={12} /> Edit
                </button>
                <button type="button" onClick={() => { if (confirm("Delete this note?")) del.mutate(n.id); }}
                  className="inline-grid h-6 w-6 place-items-center rounded-md text-red-500 hover:bg-red-50"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Small helpers
// ============================================================
const inp = "w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c9a961]";
function F({ label, children, full }: { label: string; children: any; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function LogoUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) { toast.error("Only JPG, PNG, WEBP or SVG images allowed"); return; }
    if (file.size > MAX_LOGO_BYTES) { toast.error("Max size 5 MB"); return; }
    setBusy(true);
    try {
      const url = await uploadStorageMedia("site-media", file, "builders");
      onChange(url);
      toast.success("Logo uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Logo / Profile Image</label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {value ? (
        <div className="flex items-center gap-3 rounded-md border border-slate-200 p-2">
          <img src={value} alt="Logo preview" className="h-14 w-14 rounded object-contain bg-slate-50" />
          <div className="flex flex-1 flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Replace
            </button>
            <button type="button" disabled={busy} onClick={() => onChange("")}
              className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {busy ? "Uploading…" : "Choose image"}
        </button>
      )}
      <p className="mt-1 text-[11px] text-slate-400">JPG, PNG, WEBP, SVG · max 5 MB</p>
    </div>
  );
}

// Backwards-compat exports (used elsewhere)
export function Input({ label, value, onChange, type = "text", required }: { label: string; value: any; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c9a961]" />
    </div>
  );
}
export function Modal({ children, onClose, title }: { children: any; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[#0a1f44]">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
