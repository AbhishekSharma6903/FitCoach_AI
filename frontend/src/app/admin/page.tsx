"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UtensilsCrossed, BarChart3, ChevronRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";

interface Stats {
  total_users: number;
  total_food_items: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => setError("Not authorised or failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-brand-400 hover:text-brand-300 text-sm font-medium">
            ← App
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-lg font-bold text-gray-100">Admin Panel</h1>
        </div>
        <UserButton />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {loading && <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center py-6">
              <p className="text-4xl font-bold text-gray-100">{stats.total_users}</p>
              <p className="text-sm text-gray-500 mt-1">Total Users</p>
            </Card>
            <Card className="text-center py-6">
              <p className="text-4xl font-bold text-gray-100">{stats.total_food_items}</p>
              <p className="text-sm text-gray-500 mt-1">Food Items</p>
            </Card>
          </div>
        )}

        {/* Nav cards */}
        <div className="space-y-3">
          {[
            { href: "/admin/users", icon: Users, label: "User Management", sub: "View all users and their profiles" },
            { href: "/admin/food", icon: UtensilsCrossed, label: "Food Dataset", sub: "Add, edit or delete food items" },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}>
              <Card className="flex items-center gap-4 hover:border-gray-700 transition-colors cursor-pointer card-hover">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </div>
                <ChevronRight size={16} className="text-gray-600" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
