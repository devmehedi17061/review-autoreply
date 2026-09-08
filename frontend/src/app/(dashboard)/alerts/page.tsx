"use client";

import { useCallback, useEffect, useState } from "react";
import { ReviewCard } from "@/components/reviews/review-card";
import { apiFetch } from "@/lib/api-client";
import type { Review } from "@/types/api";

/** Everything the safety router held back for a person, newest first. */
export default function AlertsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setReviews(await apiFetch<Review[]>("/reviews?needsApproval=true"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load alerts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(replyId: string, finalReply: string) {
    await apiFetch(`/replies/${replyId}`, { method: "PATCH", body: JSON.stringify({ finalReply }) });
    await apiFetch(`/replies/${replyId}/approve`, { method: "POST" });
    await load();
  }

  async function reject(replyId: string) {
    await apiFetch(`/replies/${replyId}/reject`, { method: "POST" });
    await load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Alerts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reviews held for a person — either low-rated, or flagged for sensitive content the star
          rating alone would have missed.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {!isLoading && reviews.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Nothing waiting for approval. Every review has been handled.
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} onApprove={approve} onReject={reject} />
        ))}
      </div>
    </div>
  );
}
