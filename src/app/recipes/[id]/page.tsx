import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteRecipe } from "@/app/actions";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await isAdmin();
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!recipe) notFound();

  const ingredients = recipe.ingredients.split("\n").filter(Boolean);
  const instructions = recipe.instructions.split("\n").filter(Boolean);

  const deleteAction = deleteRecipe.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="text-amber-600 hover:underline text-sm">← Back</Link>
      </div>

      <div className="bg-white rounded-xl border border-amber-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-amber-900">{recipe.title}</h1>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/recipes/${id}/edit`}
              className="text-sm border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Edit
            </Link>
            {admin && (
              <form action={deleteAction}>
                <button
                  type="submit"
                  className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  onClick={(e) => {
                    if (!confirm("Delete this recipe?")) e.preventDefault();
                  }}
                >
                  Delete
                </button>
              </form>
            )}
          </div>
        </div>

        {recipe.description && (
          <p className="text-zinc-600 mb-4">{recipe.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.tags.map(({ tag }) => (
            <Link
              key={tag.id}
              href={`/?tag=${encodeURIComponent(tag.name)}`}
              className="bg-amber-100 text-amber-700 text-sm px-3 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>

        <div className="flex gap-6 text-sm text-zinc-500 border-t border-b border-amber-100 py-3 mb-6">
          {recipe.prepTime && <span>Prep: <strong className="text-zinc-700">{recipe.prepTime} min</strong></span>}
          {recipe.cookTime && <span>Cook: <strong className="text-zinc-700">{recipe.cookTime} min</strong></span>}
          {recipe.servings && <span>Serves: <strong className="text-zinc-700">{recipe.servings}</strong></span>}
        </div>

        <section className="mb-6">
          <h2 className="font-semibold text-amber-900 mb-3">Ingredients</h2>
          <ul className="space-y-1.5">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-700">
                <span className="text-amber-400 mt-0.5">•</span>
                {ing}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold text-amber-900 mb-3">Instructions</h2>
          <ol className="space-y-3">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-700">
                <span className="bg-amber-100 text-amber-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <div className="flex gap-3 pt-4 border-t border-amber-100">
          <a
            href={`/api/recipes/${id}/export?format=pdf`}
            className="text-sm bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Download PDF
          </a>
          <a
            href={`/api/recipes/${id}/export?format=docx`}
            className="text-sm bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Download Word
          </a>
        </div>
      </div>
    </div>
  );
}
