import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Edit2, Eye, EyeOff, X, RefreshCw, ClipboardList, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useServerFn } from "@tanstack/react-start";
import { listStaff, listStaffPermissions, upsertStaffPermissions, updateStaffStatus, updateStaffProfile, type StaffUser, type StaffPermission } from "@/lib/staff";
import { createStaffUser, deleteStaffUser, resetStaffPassword } from "@/lib/staff.functions";
import { STAFF_MODULES, STAFF_MODULE_GROUPS, type StaffActionKey } from "@/lib/staff-modules";

export const Route = createFileRoute("/admin/staff")({ component: StaffPage });

type PermDraft = Record<string, Partial<Record<StaffActionKey, boolean>>>;

function emptyPerms(): PermDraft {
  const out: PermDraft = {};
  for (const m of STAFF_MODULES) out[m.key] = {};
  return out;
}

function permsToRows(draft: PermDraft) {
  return STAFF_MODULES
    .map((m) => ({
      module_name: m.key,
      can_view: !!draft[m.key]?.view,
      can_add: !!draft[m.key]?.add,
      can_edit: !!draft[m.key]?.edit,
      can_delete: !!draft[m.key]?.delete,
      can_publish: !!draft[m.key]?.publish,
      can_export: !!draft[m.key]?.export,
    }))
    .filter((r) => r.can_view || r.can_add || r.can_edit || r.can_delete || r.can_publish || r.can_export);
}

function rowsToDraft(rows: StaffPermission[]): PermDraft {
  const out = emptyPerms();
  for (const r of rows) {
    out[r.module_name] = {
      view: r.can_view, add: r.can_add, edit: r.can_edit,
      delete: r.can_delete, publish: r.can_publish, export: r.can_export,
    };
  }
  return out;
}

function StaffPage() {
  const qc = useQueryClient();
  const { data: staff = [], isLoading } = useQuery({ queryKey: ["admin-staff"], queryFn: listStaff });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffUser | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null);

  function handleDeleteClick(s: StaffUser) {
    setDeletingStaff(s);
  }

  async function handleToggleStatus(s: StaffUser) {
    try {
      await updateStaffStatus(s.id, s.status === "active" ? "inactive" : "active");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    } catch (e: any) {
      toast.error(typeof e === "string" ? e : e.message || "Failed to update staff status");
    }
  }

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Dashboard
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0a1f44]">Staff Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Create staff accounts, view credentials, and configure module access.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/logs" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <ClipboardList size={14} /> Activity Log
          </Link>
          <button onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9a961] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#b89651]">
            <Plus size={15} /> Add Staff
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Emp Code</th>
              <th className="p-3">Designation</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading…</td></tr>}
            {!isLoading && staff.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No staff accounts found. Click "Add Staff" to get started.</td></tr>}
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="p-3 font-semibold text-[#0a1f44]">{s.name}</td>
                <td className="p-3 text-slate-600">{s.email}</td>
                <td className="p-3 text-slate-600">{s.mobile ?? "—"}</td>
                <td className="p-3 text-slate-500 font-mono text-xs">{s.employee_code ?? "—"}</td>
                <td className="p-3 text-slate-500">{s.designation ?? "—"}</td>
                <td className="p-3">
                  <button onClick={() => handleToggleStatus(s)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {s.status}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setViewingStaff(s)} title="View Details"
                      className="grid h-8 w-8 place-items-center rounded-md text-blue-600 hover:bg-blue-50 transition-colors">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => { setEditing(s); setModalOpen(true); }} title="Edit"
                      className="grid h-8 w-8 place-items-center rounded-md text-amber-600 hover:bg-amber-50 transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDeleteClick(s)} title="Delete"
                      className="grid h-8 w-8 place-items-center rounded-md text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
        {isLoading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Loading staff…</div>}
        {!isLoading && staff.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No staff accounts found.</div>}
        {!isLoading && staff.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm text-[#0a1f44]">{s.name}</div>
                <div className="text-xs text-slate-500">{s.designation || "Staff Member"} {s.employee_code ? `(${s.employee_code})` : ""}</div>
              </div>
              <button onClick={() => handleToggleStatus(s)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {s.status}
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div><strong className="text-slate-500">Email:</strong> {s.email}</div>
              <div><strong className="text-slate-500">Mobile:</strong> {s.mobile || "—"}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setViewingStaff(s)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                <Eye size={13} /> View
              </button>
              <button onClick={() => { setEditing(s); setModalOpen(true); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Edit2 size={13} /> Edit
              </button>
              <button onClick={() => handleDeleteClick(s)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewingStaff && (
        <ViewStaffModal
          staff={viewingStaff}
          onClose={() => setViewingStaff(null)}
          onEdit={() => {
            setEditing(viewingStaff);
            setViewingStaff(null);
            setModalOpen(true);
          }}
        />
      )}

      {modalOpen && (
        <StaffModal
          staff={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); qc.invalidateQueries({ queryKey: ["admin-staff"] }); }}
        />
      )}

      {deletingStaff && (
        <DeleteStaffModal
          staff={deletingStaff}
          onClose={() => setDeletingStaff(null)}
          onDeleted={() => {
            setDeletingStaff(null);
            qc.invalidateQueries({ queryKey: ["admin-staff"] });
          }}
        />
      )}
    </div>
  );
}

function ViewStaffModal({ staff, onClose, onEdit }: { staff: StaffUser; onClose: () => void; onEdit: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const { data: perms = [], isLoading: loadingPerms } = useQuery({
    queryKey: ["admin-staff-perms-view", staff.id],
    queryFn: () => listStaffPermissions(staff.id),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0a1f44]">{staff.name}</h2>
            <p className="text-xs text-slate-500">{staff.designation || "Staff Member"} • Account Details</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">
              <Edit2 size={13} /> Edit Account
            </button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-200"><X size={16} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm">
            <div><span className="text-xs text-slate-500 font-medium block">Full Name</span> <span className="font-semibold text-slate-800">{staff.name}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Email Address</span> <span className="font-semibold text-slate-800">{staff.email}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Mobile Phone</span> <span className="font-semibold text-slate-800">{staff.mobile || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Employee Code</span> <span className="font-semibold text-slate-800">{staff.employee_code || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Username / ID</span> <span className="font-semibold text-slate-800">{staff.username || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Designation / Role</span> <span className="font-semibold text-slate-800">{staff.designation || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Department</span> <span className="font-semibold text-slate-800">{staff.department || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Branch</span> <span className="font-semibold text-slate-800">{staff.branch || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Territory</span> <span className="font-semibold text-slate-800">{staff.territory || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Joining Date</span> <span className="font-semibold text-slate-800">{staff.joining_date || "—"}</span></div>
            <div><span className="text-xs text-slate-500 font-medium block">Account Status</span> 
              <span className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${staff.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {staff.status}
              </span>
            </div>
          </div>

          {/* Password section */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">Account Login Password</div>
            <div className="flex items-center justify-between gap-3 bg-white rounded-lg border border-amber-200 px-3.5 py-2.5">
              <div className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                {showPassword ? (staff.plain_password || "••••••••") : "••••••••••••"}
              </div>
              <button 
                onClick={() => setShowPassword(!showPassword)} 
                className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200 transition"
              >
                {showPassword ? <><EyeOff size={13} /> Hide Password</> : <><Eye size={13} /> Show Password</>}
              </button>
            </div>
          </div>

          {/* Assigned Permissions */}
          <div>
            <h3 className="font-display text-base font-semibold text-[#0a1f44] mb-2">Assigned Module Permissions</h3>
            {loadingPerms ? (
              <div className="text-xs text-slate-400 py-4">Loading permissions…</div>
            ) : perms.length === 0 ? (
              <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200">No specific module permissions configured for this staff account.</div>
            ) : (
              <div className="space-y-2">
                {perms.map((p) => {
                  const mod = STAFF_MODULES.find((m) => m.key === p.module_name);
                  const actions = [];
                  if (p.can_view) actions.push("View");
                  if (p.can_add) actions.push("Add");
                  if (p.can_edit) actions.push("Edit");
                  if (p.can_delete) actions.push("Delete");
                  if (p.can_publish) actions.push("Publish");
                  if (p.can_export) actions.push("Export");

                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-800">{mod?.label || p.module_name}</span>
                      <div className="flex flex-wrap gap-1">
                        {actions.map((act) => (
                          <span key={act} className="rounded-full bg-[#c9a961]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0a1f44]">
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffModal({ staff, onClose, onSaved }: { staff: StaffUser | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!staff;
  const [name, setName] = useState(staff?.name ?? "");
  const [mobile, setMobile] = useState(staff?.mobile ?? "");
  const [email, setEmail] = useState(staff?.email ?? "");
  const [password, setPassword] = useState(staff?.plain_password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(staff?.plain_password ?? "");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [designation, setDesignation] = useState(staff?.designation ?? "");
  const [employeeCode, setEmployeeCode] = useState(staff?.employee_code ?? "");
  const [username, setUsername] = useState(staff?.username ?? "");
  const [department, setDepartment] = useState(staff?.department ?? "");
  const [branch, setBranch] = useState(staff?.branch ?? "");
  const [territory, setTerritory] = useState(staff?.territory ?? "");
  const [joiningDate, setJoiningDate] = useState(staff?.joining_date ?? "");

  const [status, setStatus] = useState<"active" | "inactive">(staff?.status ?? "active");
  const [draft, setDraft] = useState<PermDraft>(emptyPerms());
  const [saving, setSaving] = useState(false);
  const createFn = useServerFn(createStaffUser);
  const resetFn = useServerFn(resetStaffPassword);

  useQuery({
    queryKey: ["admin-staff-perms", staff?.id],
    enabled: !!staff?.id,
    queryFn: async () => {
      const rows = await listStaffPermissions(staff!.id);
      setDraft(rowsToDraft(rows));
      return rows;
    },
  });

  const toggle = (modKey: string, action: StaffActionKey) =>
    setDraft((d) => ({ ...d, [modKey]: { ...d[modKey], [action]: !d[modKey]?.[action] } }));

  const toggleGroupAll = (group: string, on: boolean) =>
    setDraft((d) => {
      const next = { ...d };
      for (const m of STAFF_MODULES.filter((m) => m.group === group)) {
        const entry: Partial<Record<StaffActionKey, boolean>> = {};
        for (const a of m.actions) entry[a] = on;
        next[m.key] = entry;
      }
      return next;
    });

  const grouped = useMemo(() => {
    return STAFF_MODULE_GROUPS.map((g) => ({ group: g, modules: STAFF_MODULES.filter((m) => m.group === g) }));
  }, []);

  async function handleSave() {
    if (!name.trim() || !email.trim()) { 
      toast.error("Name and email are required"); 
      return; 
    }
    
    if (!isEdit && !password) { 
      toast.error("Password is required for new staff"); 
      return; 
    }

    if (password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateStaffProfile(staff!.id, { 
          name, 
          mobile: mobile || null, 
          designation: designation || null,
          employee_code: employeeCode || null,
          username: username || null,
          department: department || null,
          branch: branch || null,
          territory: territory || null,
          joining_date: joiningDate || null,
          plain_password: password || staff!.plain_password || null,
        });
        await updateStaffStatus(staff!.id, status);
        await upsertStaffPermissions(staff!.id, permsToRows(draft));
        if (password && password !== staff!.plain_password) {
          await resetFn({ data: { auth_user_id: staff!.auth_user_id, password } });
        }
        toast.success("Staff updated successfully");
      } else {
        await createFn({
          data: {
            name, email, 
            mobile: mobile || null, 
            designation: designation || null,
            employee_code: employeeCode || null,
            username: username || null,
            department: department || null,
            branch: branch || null,
            territory: territory || null,
            joining_date: joiningDate || null,
            password, 
            status, 
            permissions: permsToRows(draft),
          },
        });
        toast.success("Staff created successfully");
      }
      onSaved();
    } catch (e: any) { 
      toast.error(typeof e === "string" ? e : e.message || "Failed to save staff"); 
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-[#0a1f44]">{isEdit ? "Edit Staff Account" : "Add New Staff"}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *"><input value={name} onChange={(e) => setName(e.target.value)} className="ts-input" placeholder="Full name" /></Field>
            <Field label="Email *"><input type="email" value={email} disabled={isEdit} onChange={(e) => setEmail(e.target.value)} className="ts-input disabled:bg-slate-100" placeholder="email@example.com" /></Field>
            <Field label="Mobile"><input value={mobile} onChange={(e) => setMobile(e.target.value)} className="ts-input" placeholder="+91 99999 99999" /></Field>
            <Field label="Employee Code"><input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} className="ts-input" placeholder="e.g. EMP-001" /></Field>
            <Field label="Username (Optional ID)"><input value={username} onChange={(e) => setUsername(e.target.value)} className="ts-input" placeholder="e.g. jsmith" /></Field>
            <Field label="Designation / Role"><input value={designation} onChange={(e) => setDesignation(e.target.value)} className="ts-input" placeholder="e.g. Sales Manager" /></Field>
            <Field label="Department"><input value={department} onChange={(e) => setDepartment(e.target.value)} className="ts-input" placeholder="e.g. Sales" /></Field>
            <Field label="Branch"><input value={branch} onChange={(e) => setBranch(e.target.value)} className="ts-input" placeholder="e.g. Headquarters" /></Field>
            <Field label="Territory"><input value={territory} onChange={(e) => setTerritory(e.target.value)} className="ts-input" placeholder="e.g. North Region" /></Field>
            <Field label="Joining Date"><input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="ts-input" /></Field>
            
            {/* Password Field */}
            <Field label={isEdit ? "Password" : "Password *"}>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="ts-input pr-10" 
                  placeholder={isEdit ? "Enter new password" : "Enter password"} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Confirm Password Field */}
            <Field label={isEdit ? "Confirm Password" : "Confirm Password *"}>
              <div className="relative">
                <input 
                  type={showConfirmPass ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="ts-input pr-10" 
                  placeholder="Re-enter password" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Status">
              <div className="flex gap-2 mt-1">
                {(["active", "inactive"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`rounded-lg border px-4 py-2 text-xs font-semibold capitalize transition ${status === s ? "border-[#c9a961] bg-[#c9a961] text-white shadow-xs" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-[#0a1f44]">Role & Permissions</h3>
            <p className="text-xs text-slate-500">Pick exactly which modules and actions this staff member can access.</p>
            <div className="mt-4 space-y-4">
              {grouped.map(({ group, modules }) => {
                const allOn = modules.every((m) => m.actions.every((a) => draft[m.key]?.[a]));
                const anyOn = modules.some((m) => m.actions.some((a) => draft[m.key]?.[a]));
                return (
                  <div key={group} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#0a1f44]">{group}</div>
                        {!anyOn && <div className="text-[11px] text-slate-400">None selected</div>}
                      </div>
                      <button type="button" onClick={() => toggleGroupAll(group, !allOn)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
                        {allOn ? "Disable all" : "Enable all"}
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {modules.map((m) => (
                        <div key={m.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <div className="min-w-[160px] flex-1 text-sm font-medium text-slate-700">{m.label}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {m.actions.map((a) => {
                              const on = !!draft[m.key]?.[a];
                              return (
                                <button key={a} type="button" onClick={() => toggle(m.key, a)}
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition ${on ? "bg-[#c9a961] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                  {a}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9a961] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b89651] disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Staff"}
          </button>
        </div>
      </div>

      <style>{`.ts-input{width:100%;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;background:white}.ts-input:focus{outline:none;border-color:#c9a961;box-shadow:0 0 0 3px rgba(201,169,97,0.15)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      {children}
    </label>
  );
}

function DeleteStaffModal({ staff, onClose, onDeleted }: { staff: StaffUser; onClose: () => void; onDeleted: () => void }) {
  const [checked, setChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteFn = useServerFn(deleteStaffUser);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteFn({ data: { staffId: staff.id } });
      toast.success(result?.message || "Staff member deleted successfully.");
      onDeleted();
    } catch (e: any) {
      toast.error(typeof e === "string" ? e : e.message || "Failed to delete staff member.");
      setDeleting(false);
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !deleting) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[480px] rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-[#0a1f44]">Delete Staff Member?</h2>
          <button onClick={() => !deleting && onClose()} disabled={deleting} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm font-medium text-slate-700 mb-4">
            You are about to permanently delete this staff account.
          </p>
          
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2 mb-5">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-semibold text-charcoal">{staff.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-charcoal">{staff.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mobile:</span>
              <span className="text-charcoal">{staff.mobile || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Designation:</span>
              <span className="text-charcoal">{staff.designation || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="capitalize text-charcoal">{staff.status}</span>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-5">
            <p className="text-xs font-medium text-amber-800">
              This action will remove the staff login and permissions. Historical tasks and activity records will be preserved.
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={(e) => setChecked(e.target.checked)} 
              disabled={deleting}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
            />
            <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900">
              I understand that this action cannot be undone.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button 
            onClick={onClose} 
            disabled={deleting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete} 
            disabled={!checked || deleting}
            className="inline-flex min-w-[120px] justify-center items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition"
          >
            {deleting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Staff"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
