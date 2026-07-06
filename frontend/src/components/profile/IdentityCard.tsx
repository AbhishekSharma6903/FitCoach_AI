"use client";

import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ACTIVITY_LABELS, DIET_LABELS, EXPERIENCE_LABELS } from "@/lib/profileUtils";
import type { UserProfile } from "@/types/profile";

interface IdentityCardProps {
  profile: UserProfile;
}

export default function IdentityCard({ profile }: IdentityCardProps) {
  const initial = profile.name?.[0]?.toUpperCase() ?? "?";

  const genderLabel = profile.gender === "male" ? "Male"
    : profile.gender === "female" ? "Female"
    : "Other";

  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-primary/10 ring-2 ring-primary/20
                        flex items-center justify-center text-xl font-black text-primary
                        shrink-0 select-none">
          {initial}
        </div>

        {/* Name + demographics */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-foreground truncate">{profile.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {profile.age} yrs · {genderLabel} · {profile.height_cm} cm
          </p>

          {/* Lifestyle badges */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {profile.activity_level && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-[#2A2A2A]">
                {ACTIVITY_LABELS[profile.activity_level] ?? profile.activity_level}
              </Badge>
            )}
            {profile.diet_type && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-[#2A2A2A]">
                {DIET_LABELS[profile.diet_type] ?? profile.diet_type}
              </Badge>
            )}
            {profile.experience_level && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-[#2A2A2A]">
                {EXPERIENCE_LABELS[profile.experience_level] ?? profile.experience_level}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-3">
        To change name, age, height or experience — use Re-do Onboarding below.
      </p>
    </Card>
  );
}
