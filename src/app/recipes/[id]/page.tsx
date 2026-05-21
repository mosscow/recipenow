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
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <div className="max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm mb-6">
        ← Back to recipes
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden mb-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-6 pt-8 pb-6 border-b border-amber-100">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="text-3xl font-bold text-amber-900 leading-tight">{recipe.title}</h1>
            <div className="flex gap-2 shrink-0 pt-1">
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
                    className="text-sm border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={(e) => { if (!confirm("Delete this recipe?")) e.preventDefault(); }}
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          </div>

          {recipe.description && (
            <p className="text-zinc-600 text-base leading-relaxed mb-4">{recipe.description}</p>
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/?tag=${encodeURIComponent(tag.name)}`}
                  className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-amber-200 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stats bar */}
        {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
          <div className="grid grid-cols-3 divide-x divide-amber-100">
            {recipe.prepTime ? (
              <div className="px-4 py-4 text-center">
                <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Prep</div>
                <div className="text-xl font-bold text-amber-800">{recipe.prepTime}</div>
                <div className="text-xs text-zinc-400">min</div>
              </div>
            ) : <div />}
            {recipe.cookTime ? (
              <div className="px-4 py-4 text-center">
                <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Cook</div>
                <div className="text-xl font-bold text-amber-800">{recipe.cookTime}</div>
                <div className="text-xs text-zinc-400">min</div>
              </div>
            ) : totalTime > 0 ? (
              <div className="px-4 py-4 text-center">
                <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Total</div>
                <div className="text-xl font-bold text-amber-800">{totalTime}</div>
                <div className="text-xs text-zinc-400">min</div>
              </div>
            ) : <div />}
            {recipe.servings ? (
              <div className="px-4 py-4 text-center">
                <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Serves</div>
                <div className="text-xl font-bold text-amber-800">{recipe.servings}</div>
                <div className="text-xs text-zinc-400">people</div>
              </div>
            ) : <div />}
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-4">
        <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">✦</span>
          Ingredients
          <span className="text-sm font-normal text-zinc-400 ml-auto">{ingredients.length} items</span>
        </h2>
        <ul className="space-y-2.5">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 group">
              <span className="w-5 h-5 rounded-full border-2 border-amber-200 flex-shrink-0 mt-0.5 group-hover:border-amber-400 transition-colors" />
              <span>{ing}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 mb-4">
        <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">★</span>
          Instructions
          <span className="text-sm font-normal text-zinc-400 ml-auto">{instructions.length} steps</span>
        </h2>
        <ol className="space-y-5">
          {instructions.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-700 leading-relaxed pt-1.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Export */}
      <div className="flex gap-3">
        <a
          href={`/api/recipes/${id}/export?format=pdf`}
          className="flex-1 text-center text-sm bg-white border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl hover:bg-amber-50 transition-colors font-medium"
        >
          ↓ Download PDF
        </a>
        <a
          href={`/api/recipes/${id}/export?format=docx`}
          className="flex-1 text-center text-sm bg-white border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl hover:bg-amber-50 transition-colors font-medium"
        >
          ↓ Download Word
        </a>
      </div>
    </div>
  );
}
