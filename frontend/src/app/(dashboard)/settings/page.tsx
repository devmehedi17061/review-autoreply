"use client";

import { useEffect, useState } from "react";
import type { Brand } from "@/types/api";
import { apiFetch } from "@/lib/api-client";

export default function SettingsPage() {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Brand[]>("/brands")
      .then(setBrands)
      .catch((err) => setError(err.message));
  }, []);

  async function saveTone(brand: Brand, tone: string) {
    const updated = await apiFetch<Brand>(`/brands/${brand.id}`, {
      method: "PATCH",
      body: JSON.stringify({ tone }),
    });
    setBrands((prev) => prev?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Brand tone & rules</h1>
        <p className="mt-1 text-sm text-gray-500">
          This is the instruction the AI reads before drafting a reply for each brand. Platform account
          connections (Google Business Profile) and location management land in a later phase.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {brands?.map((brand) => (
        <BrandToneEditor key={brand.id} brand={brand} onSave={(tone) => saveTone(brand, tone)} />
      ))}
    </div>
  );
}

function BrandToneEditor({ brand, onSave }: { brand: Brand; onSave: (tone: string) => Promise<void> }) {
  const [tone, setTone] = useState(brand.tone);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(tone);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="font-medium text-gray-900">{brand.name}</h2>
      <textarea
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        rows={3}
        className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink"
      />
      <button
        onClick={handleSave}
        disabled={isSaving || tone === brand.tone}
        className="mt-2 rounded-md bg-brand-pink px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
