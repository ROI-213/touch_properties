import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty, addPropertyImage, setPropertyAmenities } from "@/lib/admin-properties";
import { saveAssignments } from "@/lib/property-assignments";

export const Route = createFileRoute("/admin/properties/new")({
  component: NewProperty,
});

function NewProperty() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [formKey, setFormKey] = useState(0);

  const m = useMutation({
    mutationFn: async ({ values, images, amenityIds, assignments, addAnother }: any) => {
      const created = await createProperty(values);
      await Promise.all([
        ...images.map((img: any) =>
          addPropertyImage(created.id, img.url, img.image_type, img.caption || ""),
        ),
        setPropertyAmenities(created.id, amenityIds),
        saveAssignments(created.id, assignments ?? []),
      ]);
      return { created, addAnother };
    },
    onSuccess: ({ created, addAnother }) => {
      toast.success("Property published successfully!");
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["public-properties"] });
      qc.invalidateQueries({ queryKey: ["recent-property-notifications"] });
      if (addAnother) {
        setFormKey((k) => k + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate({ to: "/admin/properties", search: {} as any });
      }
    },
    onError: (e: any) => toast.error(e.message || "Failed to create property"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/admin/properties"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={14} /> Back to properties
      </Link>
      <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#0a1f44]">
        Add New Property
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Fill in the 4 quick sections below and click Publish — it goes live on the site immediately.
      </p>
      <div className="mt-5">
        <PropertyForm
          key={formKey}
          onSubmit={async (values, images, amenityIds, assignments, addAnother) => {
            await m.mutateAsync({ values, images, amenityIds, assignments, addAnother });
          }}
          submitting={m.isPending}
          submitLabel="Publish Property"
          showSaveAndNew
        />
      </div>
    </div>
  );
}
