import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Star, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadAssignmentAsset, type AssignmentDraft } from "@/lib/property-assignments";
import { supabase } from "@/integrations/supabase/client";

const input =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a961]";

export interface ExistingStaffOption {
  id: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  designation?: string | null;
  territory?: string | null;
  branch?: string | null;
  status?: string | null;
}

interface Props {
  value: AssignmentDraft[];
  onChange: (next: AssignmentDraft[]) => void;
  existingStaff?: ExistingStaffOption[];
  onSelectPrimaryStaffId?: (staffId: string) => void;
}

const emptyDraft = (isFirst = false): AssignmentDraft => ({
  staff_name: "",
  role: "",
  phone: "",
  whatsapp: "",
  email: "",
  assigned_area: "",
  notes: "",
  is_primary: isFirst,
  is_active: true,
  show_publicly: true,
  display_order: 0,
  photo_url: null,
  signature_url: null,
  id_url: null,
  qr_code_url: null,
  experience_years: null,
  languages: [],
});

export function AssignmentsEditor({
  value,
  onChange,
  existingStaff = [],
  onSelectPrimaryStaffId,
}: Props) {
  const { data: dbStaff = [] } = useQuery({
    queryKey: ["admin-staff-all-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users" as any)
        .select("id, name, email, mobile, designation, territory, branch, status")
        .order("name");
      if (error) return [];
      return (data ?? []) as ExistingStaffOption[];
    },
  });

  const staffOptions = useMemo(() => {
    const map = new Map<string, ExistingStaffOption>();
    for (const s of [...existingStaff, ...dbStaff]) {
      if (s && s.id && s.name?.trim()) {
        map.set(s.id, s);
      }
    }
    return Array.from(map.values());
  }, [existingStaff, dbStaff]);

  const update = (i: number, patch: Partial<AssignmentDraft>) =>
    onChange(value.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, emptyDraft(value.length === 0)]);
  const makePrimary = (i: number) =>
    onChange(value.map((d, idx) => ({ ...d, is_primary: idx === i })));

  const draftFromStaff = (s: ExistingStaffOption, isPrimary: boolean): AssignmentDraft => ({
    staff_name: (s.name || "").trim(),
    role: s.designation || "Property Consultant",
    phone: s.mobile || "",
    whatsapp: s.mobile || "",
    email: s.email || "",
    assigned_area: s.territory || s.branch || "",
    notes: "",
    is_primary: isPrimary,
    is_active: true,
    show_publicly: true,
    display_order: value.length,
    photo_url: null,
    signature_url: null,
    id_url: null,
    qr_code_url: null,
    experience_years: null,
    languages: [],
  });

  const handleQuickSelectStaff = (staffId: string) => {
    if (!staffId) return;
    const found = staffOptions.find((s) => s.id === staffId);
    if (!found) return;
    onSelectPrimaryStaffId?.(found.id);
    const alreadyIdx = value.findIndex(
      (d) =>
        d.staff_name.trim().toLowerCase() === found.name.trim().toLowerCase() ||
        (found.email && d.email?.toLowerCase() === found.email.toLowerCase()),
    );
    if (alreadyIdx >= 0) {
      update(alreadyIdx, {
        staff_name: found.name.trim(),
        role: found.designation || value[alreadyIdx].role || "Property Consultant",
        phone: found.mobile || value[alreadyIdx].phone || "",
        whatsapp: found.mobile || value[alreadyIdx].whatsapp || "",
        email: found.email || value[alreadyIdx].email || "",
        assigned_area: found.territory || found.branch || value[alreadyIdx].assigned_area || "",
        is_active: true,
        show_publicly: true,
      });
      toast.success(`Updated ${found.name.trim()} details`);
      return;
    }
    const isFirst = value.length === 0 || !value.some((d) => d.is_primary);
    onChange([...value, draftFromStaff(found, isFirst)]);
    toast.success(`Added ${found.name.trim()} to property staff`);
  };

  const applyStaffToRow = (index: number, staffId: string) => {
    const found = staffOptions.find((s) => s.id === staffId);
    if (!found) return;
    if (value[index]?.is_primary || value.length === 1) {
      onSelectPrimaryStaffId?.(found.id);
    }
    update(index, {
      staff_name: (found.name || "").trim(),
      role: found.designation || value[index]?.role || "Property Consultant",
      phone: found.mobile || value[index]?.phone || "",
      whatsapp: found.mobile || value[index]?.whatsapp || "",
      email: found.email || value[index]?.email || "",
      assigned_area: found.territory || found.branch || value[index]?.assigned_area || "",
      is_active: true,
      show_publicly: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#0a1f44]">Assigned Staff / Workers</div>
          <div className="text-xs text-slate-500">
            Select an existing staff member from the dropdown or click &ldquo;Add Staff&rdquo; to enter details.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#0a1f44] outline-none focus:border-[#c9a961]"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleQuickSelectStaff(e.target.value);
              }
            }}
          >
            <option value="">— Select Existing Staff ({staffOptions.length}) —</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.trim()}
                {s.designation ? ` · ${s.designation}` : ""}
                {s.mobile ? ` · ${s.mobile}` : ""}
                {s.email ? ` (${s.email})` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-md bg-[#0a1f44] px-3 py-2 text-xs font-medium text-white hover:bg-[#0a1f44]/90"
          >
            <Plus size={13} /> Add Staff
          </button>
        </div>
      </div>

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No staff assigned yet. Choose from <span className="font-medium">Select Existing Staff</span> above or click <span className="font-medium">Add Staff</span>.
        </div>
      )}

      <datalist id="existing-staff-datalist">
        {staffOptions.map((s) => (
          <option
            key={s.id}
            value={s.name.trim()}
            label={`${s.designation ? `${s.designation} · ` : ""}${s.mobile || s.email || ""}`}
          />
        ))}
      </datalist>

      <div className="space-y-3">
        {value.map((d, i) => {
          const matchedStaff = staffOptions.find(
            (s) => s.name.trim().toLowerCase() === (d.staff_name || "").trim().toLowerCase(),
          );
          return (
          <div
            key={i}
            className={`rounded-xl border p-4 ${
              d.is_primary ? "border-[#c9a961] bg-[#c9a961]/5" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Staff #{i + 1}
                </span>
                {d.is_primary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a961] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    <Star size={10} /> Primary
                  </span>
                )}
                {!d.is_active && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    Disabled
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!d.is_primary && (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Star size={12} /> Make Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <PhotoField
                value={d.photo_url}
                onChange={(url) => update(i, { photo_url: url })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Select Existing Staff" full>
                  <select
                    className={input}
                    value={matchedStaff?.id || ""}
                    onChange={(e) => {
                      if (e.target.value) applyStaffToRow(i, e.target.value);
                    }}
                  >
                    <option value="">— Click to Select Existing Staff —</option>
                    {staffOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name.trim()}
                        {s.designation ? ` · ${s.designation}` : ""}
                        {s.mobile ? ` · ${s.mobile}` : ""}
                        {s.email ? ` (${s.email})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Staff Name *">
                  <input
                    list="existing-staff-datalist"
                    className={input}
                    placeholder="Select from dropdown or type staff name"
                    value={d.staff_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = staffOptions.find(
                        (s) => s.name.trim().toLowerCase() === val.trim().toLowerCase(),
                      );
                      if (match) {
                        applyStaffToRow(i, match.id);
                      } else {
                        update(i, { staff_name: val });
                      }
                    }}
                  />
                </Field>
                <Field label="Role / Designation">
                  <input
                    className={input}
                    value={d.role || ""}
                    onChange={(e) => update(i, { role: e.target.value })}
                    placeholder="e.g. Property Expert, Site Manager"
                  />
                </Field>
                <Field label="Phone Number *">
                  <input
                    className={input}
                    value={d.phone}
                    onChange={(e) => update(i, { phone: e.target.value })}
                    placeholder="+91 9xxxxxxxxx"
                  />
                </Field>
                <Field label="WhatsApp Number">
                  <input
                    className={input}
                    value={d.whatsapp || ""}
                    onChange={(e) => update(i, { whatsapp: e.target.value })}
                    placeholder="+91 9xxxxxxxxx"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className={input}
                    value={d.email || ""}
                    onChange={(e) => update(i, { email: e.target.value })}
                  />
                </Field>
                <Field label="Assigned Area">
                  <input
                    className={input}
                    value={d.assigned_area || ""}
                    onChange={(e) => update(i, { assigned_area: e.target.value })}
                    placeholder="e.g. Whitefield"
                  />
                </Field>
                <Field label="Experience (Years)">
                  <input
                    type="number"
                    min={0}
                    className={input}
                    value={d.experience_years ?? ""}
                    onChange={(e) =>
                      update(i, {
                        experience_years: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Languages (comma separated)">
                  <input
                    className={input}
                    value={(d.languages ?? []).join(", ")}
                    onChange={(e) =>
                      update(i, {
                        languages: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="English, Hindi, Kannada"
                  />
                </Field>
                <Field label="Notes" full>
                  <textarea
                    rows={2}
                    className={input}
                    value={d.notes || ""}
                    onChange={(e) => update(i, { notes: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <AssetField
                label="Digital Signature"
                kind="signature"
                value={d.signature_url}
                onChange={(url) => update(i, { signature_url: url })}
              />
              <AssetField
                label="ID Document"
                kind="id"
                value={d.id_url}
                onChange={(url) => update(i, { id_url: url })}
              />
              <AssetField
                label="QR Code"
                kind="qr"
                value={d.qr_code_url}
                onChange={(url) => update(i, { qr_code_url: url })}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
              <Toggle
                checked={d.is_active}
                onChange={(c) => update(i, { is_active: c })}
                label="Enabled"
              />
              <Toggle
                checked={!!d.show_publicly}
                onChange={(c) => update(i, { show_publicly: c })}
                label="Show publicly (route site contact buttons here)"
              />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadAssignmentAsset(file, "photo");
      onChange(url);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
        Photo
      </label>
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-xs text-slate-500 hover:bg-slate-100">
            {busy ? "..." : <><Upload size={16} /><span className="mt-1">Photo</span></>}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handle(e.target.files?.[0])}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function AssetField({
  label,
  kind,
  value,
  onChange,
}: {
  label: string;
  kind: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadAssignmentAsset(file, kind));
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs">
          <a href={value} target="_blank" rel="noreferrer" className="truncate text-[#0a1f44] underline">
            View file
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-red-600 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-3 text-xs text-slate-500 hover:bg-slate-100">
          <Upload size={13} /> {busy ? "Uploading..." : "Upload"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handle(e.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#c9a961]"
      />
      {label}
    </label>
  );
}
