import UploadForm from "./UploadForm";
import Link from "next/link";

export default function UploadPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-amber-600 hover:underline text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-amber-900">Bulk Upload</h1>
      </div>
      <div className="bg-white rounded-xl border border-amber-100 p-6">
        <p className="text-sm text-zinc-600 mb-6">
          Upload one or more <strong>.docx</strong> files. Each file will be imported as a recipe.
          The filename becomes the title if no title is detected.
        </p>
        <UploadForm />
      </div>
    </div>
  );
}
