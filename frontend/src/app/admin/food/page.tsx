"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface FoodItem {
  id: number;
  name: string;
  category: string | null;
  region: string | null;
  serving_size_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  is_veg: boolean;
  is_egg: boolean;
}

const EMPTY: Omit<FoodItem, "id"> = {
  name: "", category: "", region: "", serving_size_g: 100,
  calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
  is_veg: true, is_egg: false,
};

export default function AdminFoodPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [form, setForm] = useState<Omit<FoodItem, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  function loadItems(q = "") {
    setLoading(true);
    api.get("/api/v1/admin/food", { params: { search: q || undefined, limit: 200 } })
      .then((r) => setItems(r.data))
      .catch(() => setError("Failed to load food items."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadItems(); }, []);

  function openNew() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(item: FoodItem) {
    const { id, ...rest } = item;
    setForm(rest); setEditing(item); setShowForm(true);
  }
  function cancelForm() { setShowForm(false); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/v1/admin/food/${editing.id}`, form);
      } else {
        await api.post("/api/v1/admin/food", form);
      }
      setShowForm(false);
      loadItems(search);
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this food item?")) return;
    await api.delete(`/api/v1/admin/food/${id}`);
    loadItems(search);
  }

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        step={type === "number" ? "0.1" : undefined}
        value={form[key] as string | number}
        onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        className="rounded-xl border border-gray-700 bg-gray-800 text-gray-100 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-gray-100">Food Dataset</h1>
          <span className="text-xs text-gray-600">{items.length} items</span>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" />Add item</Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <input
          placeholder="Search food items..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); loadItems(e.target.value); }}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />

        {/* Add/Edit form */}
        {showForm && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">{editing ? "Edit item" : "New food item"}</h3>
              <button onClick={cancelForm} className="text-gray-600 hover:text-gray-300"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("name", "Name *")}
              {field("category", "Category")}
              {field("region", "Region")}
              {field("serving_size_g", "Serving size (g)", "number")}
              {field("calories_kcal", "Calories (kcal/100g)", "number")}
              {field("protein_g", "Protein (g)", "number")}
              {field("carbs_g", "Carbs (g)", "number")}
              {field("fat_g", "Fat (g)", "number")}
              {field("fiber_g", "Fiber (g)", "number")}
            </div>
            <div className="flex gap-4 text-sm text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_veg}
                  onChange={(e) => setForm((f) => ({ ...f, is_veg: e.target.checked }))}
                  className="accent-brand-500" />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_egg}
                  onChange={(e) => setForm((f) => ({ ...f, is_egg: e.target.checked }))}
                  className="accent-yellow-400" />
                Contains egg
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={cancelForm}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>
                <Check size={14} className="mr-1" />{saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Card>
        )}

        {/* Table */}
        {loading && <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>}
        {!loading && (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} padding="sm" className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-200 truncate">{item.name}</p>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_veg ? "bg-brand-500" : item.is_egg ? "bg-yellow-400" : "bg-red-500"}`} />
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {item.category} {item.region && `· ${item.region}`} · {item.calories_kcal} kcal · P:{item.protein_g}g C:{item.carbs_g}g F:{item.fat_g}g
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(item)} className="text-gray-600 hover:text-brand-400 transition-colors p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
