import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

async function extractRecipeWithClaude(text: string, filename: string) {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Extract this recipe and return ONLY a JSON object. Each ingredient must be on its own line. Each instruction step must be on its own line (no sub-steps combined). Auto-generate relevant tags.

Return this exact shape:
{
  "title": "recipe title",
  "description": "one sentence describing the dish",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "ingredients": "200g flour\n2 eggs\n1 cup milk",
  "instructions": "Mix dry ingredients together.\nWhisk eggs and milk separately.\nCombine and stir until smooth.",
  "tags": ["dinner", "italian", "pasta"]
}

Rules:
- prepTime, cookTime, servings are integers or null if not mentioned
- Each ingredient is its own line — quantities included, no bullets or numbers
- Each instruction is a single complete step on its own line — no numbering
- tags: 3–6 lowercase keywords (meal type, cuisine, main ingredient, dietary info, cooking method)
- If description isn't in the text, write one from context

Filename: ${filename}

Recipe text:
${text}`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Claude response");
  return JSON.parse(match[0]) as {
    title: string;
    description: string;
    prepTime: number | null;
    cookTime: number | null;
    servings: number | null;
    ingredients: string;
    instructions: string;
    tags: string[];
  };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  let count = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (!file.name.endsWith(".docx")) continue;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { value: text } = await mammoth.extractRawText({ buffer });
      const parsed = await extractRecipeWithClaude(text, file.name);

      await prisma.recipe.create({
        data: {
          title: parsed.title,
          description: parsed.description || undefined,
          prepTime: parsed.prepTime,
          cookTime: parsed.cookTime,
          servings: parsed.servings,
          ingredients: parsed.ingredients,
          instructions: parsed.instructions,
          tags: {
            create: await Promise.all(
              parsed.tags.map(async (name) => {
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
      count++;
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ count, errors });
}
