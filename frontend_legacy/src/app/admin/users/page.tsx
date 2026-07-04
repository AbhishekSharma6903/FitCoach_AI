"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

interface UserSummary {
  user_id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  diet_type: string | null;
  experience_level: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/admin/users")
      .then((r) => setUsers(r.data))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-gray-100">User Management</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {loading && <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && users.length === 0 && (
          <p className="text-center text-gray-600 py-16 text-sm">No users found.</p>
        )}

        {users.map((u) => (
          <Card key={u.user_id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-200">{u.name ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{u.user_id}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap justify-end">
              {u.age && <span>{u.age}y</span>}
              {u.gender && <span className="capitalize">{u.gender}</span>}
              {u.experience_level && <span className="capitalize">{u.experience_level}</span>}
              {u.diet_type && (
                <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${
                  u.diet_type === "veg"
                    ? "bg-brand-500/10 border-brand-500/20 text-brand-400"
                    : u.diet_type === "egg"
                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                    : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                }`}>
                  {u.diet_type}
                </span>
              )}
              {u.current_weight_kg && u.goal_weight_kg && (
                <span>{u.current_weight_kg} → {u.goal_weight_kg} kg</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
