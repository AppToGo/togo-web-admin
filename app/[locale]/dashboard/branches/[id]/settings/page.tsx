"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BranchSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.id as string;

  useEffect(() => {
    // Redirect to the unified edit page
    router.replace(`/dashboard/branches/${branchId}/edit`);
  }, [router, branchId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
}
