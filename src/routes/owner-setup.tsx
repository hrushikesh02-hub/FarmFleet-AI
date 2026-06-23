import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { ArrowLeft, Camera, User, MapPin, Building2 } from "lucide-react";

export const Route = createFileRoute("/owner-setup")({
  component: OwnerSetup,
});

interface OwnerForm {
  fullName: string;
  email: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  ownerType: string;
  bio: string;
}

function OwnerSetup() {
  const navigate = useNavigate();

  const { register, handleSubmit } = useForm<OwnerForm>();

  const [preview, setPreview] = useState<string | null>(null);

const onSubmit = (data: OwnerForm) => {
  localStorage.setItem(
    "ownerProfile",
    JSON.stringify({
      ...data,
      profileImage: preview,
    })
  );

  navigate({
    to: "/owner/dashboard",
  });
};

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}

        <button
          onClick={() => navigate({ to: "/login-owner" })}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">
              Complete Your Owner Profile
            </h1>

            <p className="mt-2 text-muted-foreground">
              Tell renters who you are and where your equipment is located.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
          >
            {/* Profile Photo */}

            <div>
              <label className="mb-3 block text-sm font-medium">
                Profile Photo
              </label>

              <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition">
                <Camera className="h-10 w-10 text-primary" />

                <span className="mt-3 text-sm font-medium">
                  Upload Profile Photo
                </span>

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>

              {preview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-60 w-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Personal Information */}

            <div>
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Personal Information
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  {...register("fullName")}
                  placeholder="Full Name"
                  className="input"
                />

                <input
                  {...register("email")}
                  type="email"
                  placeholder="Email Address"
                  className="input"
                />
              </div>
            </div>

            {/* Location */}

            <div>
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Location Details
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  {...register("village")}
                  placeholder="Village"
                  className="input"
                />

                <input
                  {...register("taluka")}
                  placeholder="Taluka"
                  className="input"
                />

                <input
                  {...register("district")}
                  placeholder="District"
                  className="input"
                />

                <input
                  {...register("state")}
                  placeholder="State"
                  className="input"
                />

                <input
                  {...register("pincode")}
                  placeholder="Pincode"
                  className="input md:col-span-2"
                />
              </div>
            </div>

            {/* Owner Type */}

            <div>
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Owner Information
                </h2>
              </div>

              <select
                {...register("ownerType")}
                className="input"
              >
                <option value="">
                  Select Owner Type
                </option>

                <option value="farmer">
                  Individual Farmer
                </option>

                <option value="contractor">
                  Equipment Contractor
                </option>

                <option value="business">
                  Agriculture Business
                </option>
              </select>
            </div>

            {/* Bio */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                About Yourself
              </label>

              <textarea
                {...register("bio")}
                rows={5}
                placeholder="Tell renters about yourself and your equipment..."
                className="input resize-none"
              />
            </div>

            {/* Actions */}

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-gradient-primary px-8 py-3 font-semibold text-primary-foreground shadow-soft hover:shadow-elevated transition"
              >
                Complete Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: 0.9rem;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          outline: none;
        }

        .input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(
            in oklab,
            var(--color-primary) 20%,
            transparent
          );
        }
      `}</style>
    </div>
  );
}