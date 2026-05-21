import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;

  const recipes = await prisma.recipe.findMany({
    where: {
      AND: [
        q ? { title: { contains: q } } : {},
        tag ? { tags: { some: { tag: { name: tag } } } } : {},
      ],
    },
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });

  const allTags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form className="flex-1 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search recipes..."
            className="flex-1 border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/"
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !tag ? "bg-amber-600 text-white" : "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50"
            }`}
          >
            All
          </Link>
          {allTags.map((t) => (
            <Link
              key={t.id}
              href={`/?tag=${encodeURIComponent(t.name)}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                tag === t.name ? "bg-amber-600 text-white" : "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-20 text-amber-800/50">
          <p className="text-lg">No recipes yet.</p>
          <Link href="/recipes/new" className="text-amber-600 underline mt-2 inline-block">
            Add your first recipe
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl border border-amber-100 p-5 hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-amber-900 text-lg leading-tight mb-2">
                {recipe.title}
              </h2>
              {recipe.description && (
                <p className="text-sm text-zinc-600 line-clamp-2 mb-3">{recipe.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {recipe.tags.map(({ tag }) => (
                  <span key={tag.id} className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-zinc-400">
                {recipe.prepTime && <span>Prep: {recipe.prepTime}m</span>}
                {recipe.cookTime && <span>Cook: {recipe.cookTime}m</span>}
                {recipe.servings && <span>Serves: {recipe.servings}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
