"use client";

import { useRouter } from "next/navigation";

export function TombolKeluar() {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost"
      style={{ fontSize: 13, padding: "6px 14px" }}
      onClick={async () => {
        await fetch("/api/session", { method: "DELETE" });
        router.push("/");
        router.refresh();
      }}
    >
      Keluar
    </button>
  );
}
