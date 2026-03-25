"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandBoard from "@/components/BrandBoard";
import { Loader2 } from "lucide-react";

export default function BoardPage() {
  const [dna, setDna] = useState<Record<string, unknown> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("brandDna");
    if (stored) {
      try {
        setDna(JSON.parse(stored));
      } catch {
        console.error("Failed to parse stored DNA");
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!dna) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-lime-500" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <BrandBoard initialDna={dna} />
    </div>
  );
}
