"use client";

import { useActionState } from "react";

type Recipe = {
  id?: string;
  title?: string;
  description?: string;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  ingredients?: string;
  instructions?: string;
  tags?: string[];
};

export default function RecipeForm({
  recipe,
  action,
}: {
  recipe?: Recipe;
  action: (formData: FormData) => Promise<void>;
}) {
  const [, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      await action(formData);
      return null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-amber-900 mb-1">Title *</label>
        <input
          name="title"
          required
          defaultValue={recipe?.title}
          className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-900 mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={recipe?.description ?? ""}
          className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-amber-900 mb-1">Prep time (min)</label>
          <input
            name="prepTime"
            type="number"
            min="0"
            defaultValue={recipe?.prepTime ?? ""}
            className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-amber-900 mb-1">Cook time (min)</label>
          <input
            name="cookTime"
            type="number"
            min="0"
            defaultValue={recipe?.cookTime ?? ""}
            className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-amber-900 mb-1">Servings</label>
          <input
            name="servings"
            type="number"
            min="1"
            defaultValue={recipe?.servings ?? ""}
            className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-900 mb-1">Tags (comma-separated)</label>
        <input
          name="tags"
          placeholder="e.g. soup, vegetarian, quick"
          defaultValue={recipe?.tags?.join(", ") ?? ""}
          className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-900 mb-1">Ingredients *</label>
        <p className="text-xs text-zinc-500 mb-1">One per line</p>
        <textarea
          name="ingredients"
          required
          rows={8}
          defaultValue={recipe?.ingredients ?? ""}
          className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-900 mb-1">Instructions *</label>
        <p className="text-xs text-zinc-500 mb-1">One step per line</p>
        <textarea
          name="instructions"
          required
          rows={10}
          defaultValue={recipe?.instructions ?? ""}
          className="w-full border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Recipe"}
      </button>
    </form>
  );
}
