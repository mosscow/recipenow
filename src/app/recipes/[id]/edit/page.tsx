import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecipeForm from "@/components/RecipeForm";
import { updateRecipe } from "@/app/actions";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!recipe) notFound();

  const action = updateRecipe.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/recipes/${id}`} className="text-amber-600 hover:underline text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-amber-900">Edit Recipe</h1>
      </div>
      <RecipeForm
        recipe={{
          ...recipe,
          description: recipe.description ?? undefined,
          tags: recipe.tags.map(({ tag }) => tag.name),
        }}
        action={action}
      />
    </div>
  );
}
