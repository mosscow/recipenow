"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const files = (form.querySelector("input[type=file]") as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      setStatus("done");
      setMessage(`Imported ${data.count} recipe${data.count !== 1 ? "s" : ""} successfully.`);
      setTimeout(() => router.push("/"), 1500);
    } else {
      setStatus("error");
      setMessage(data.error ?? "Upload failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="file"
        accept=".docx"
        multiple
        className="block w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 file:cursor-pointer"
      />
      <button
        type="submit"
        disabled={status === "uploading"}
        className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        {status === "uploading" ? "Importing..." : "Import Recipes"}
      </button>
      {message && (
        <p className={`text-sm ${status === "done" ? "text-green-700" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
