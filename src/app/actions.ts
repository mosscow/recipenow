"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRecipe(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const servings = formData.get("servings") ? Number(formData.get("servings")) : null;
  const prepTime = formData.get("prepTime") ? Number(formData.get("prepTime")) : null;
  const cookTime = formData.get("cookTime") ? Number(formData.get("cookTime")) : null;
  const ingredients = formData.get("ingredients") as string;
  const instructions = formData.get("instructions") as string;
  const tagNames = (formData.get("tags") as string || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const recipe = await prisma.recipe.create({
    data: {
      title,
      description,
      servings,
      prepTime,
      cookTime,
      ingredients,
      instructions,
      tags: {
        create: await Promise.all(
          tagNames.map(async (name) => {
            const tag = await prisma.tag.upsert({
              where: { name },
              update: {},
              create: { name },
            });
            return { tagId: tag.id };
          })
        ),
      },
    },
  });

  revalidatePath("/");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipe(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const servings = formData.get("servings") ? Number(formData.get("servings")) : null;
  const prepTime = formData.get("prepTime") ? Number(formData.get("prepTime")) : null;
  const cookTime = formData.get("cookTime") ? Number(formData.get("cookTime")) : null;
  const ingredients = formData.get("ingredients") as string;
  const instructions = formData.get("instructions") as string;
  const tagNames = (formData.get("tags") as string || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  await prisma.recipeTag.deleteMany({ where: { recipeId: id } });

  await prisma.recipe.update({
    where: { id },
    data: {
      title,
      description,
      servings,
      prepTime,
      cookTime,
      ingredients,
      instructions,
      tags: {
        create: await Promise.all(
          tagNames.map(async (name) => {
            const tag = await prisma.tag.upsert({
              where: { name },
              update: {},
              create: { name },
            });
            return { tagId: tag.id };
          })
        ),
      },
    },
  });

  revalidatePath("/");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(id: string) {
  await requireAdmin();
  await prisma.recipe.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function importRecipes(recipes: {
  title: string;
  description?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: string;
  instructions: string;
  tags?: string[];
}[]) {
  for (const r of recipes) {
    const tagNames = (r.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
    await prisma.recipe.create({
      data: {
        title: r.title,
        description: r.description,
        servings: r.servings,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        ingredients: r.ingredients,
        instructions: r.instructions,
        tags: {
          create: await Promise.all(
            tagNames.map(async (name) => {
              const tag = await prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
              });
              return { tagId: tag.id };
            })
          ),
        },
      },
    });
  }
  revalidatePath("/");
}
