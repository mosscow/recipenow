import { createRecipe } from "@/app/actions";
import RecipeForm from "@/components/RecipeForm";
import Link from "next/link";

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-amber-600 hover:underline text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-amber-900">New Recipe</h1>
      </div>
      <RecipeForm action={createRecipe} />
    </div>
  );
}
