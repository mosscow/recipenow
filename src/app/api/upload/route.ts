import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { prisma } from "@/lib/prisma";

function parseDocxText(text: string, filename: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let title = filename.replace(/\.docx$/i, "").replace(/_/g, " ");
  let description = "";
  const ingredientLines: string[] = [];
  const instructionLines: string[] = [];
  const tags: string[] = [];

  let section: "none" | "ingredients" | "instructions" = "none";

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/^(recipe\s*name|title)\s*[:\-]?\s*/i.test(line)) {
      title = line.replace(/^(recipe\s*name|title)\s*[:\-]?\s*/i, "").trim() || title;
      continue;
    }
    if (/^(description|about|overview)\s*[:\-]?\s*/i.test(line)) {
      description = line.replace(/^(description|about|overview)\s*[:\-]?\s*/i, "").trim();
      continue;
    }

    if (/^ingredients?$/i.test(lower)) { section = "ingredients"; continue; }
    if (/^(instructions?|method|directions?|steps?|preparation)$/i.test(lower)) { section = "instructions"; continue; }

    if (section === "ingredients") {
      ingredientLines.push(line.replace(/^[-•*]\s*/, ""));
    } else if (section === "instructions") {
      instructionLines.push(line.replace(/^\d+[.)]\s*/, ""));
    } else if (section === "none" && !title) {
      title = line;
    }
  }

  if (ingredientLines.length === 0 && instructionLines.length === 0) {
    const half = Math.floor(lines.length / 2);
    ingredientLines.push(...lines.slice(0, half));
    instructionLines.push(...lines.slice(half));
  }

  return {
    title,
    description: description || undefined,
    ingredients: ingredientLines.join("\n"),
    instructions: instructionLines.join("\n"),
    tags,
  };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  let count = 0;
  for (const file of files) {
    if (!file.name.endsWith(".docx")) continue;

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    const parsed = parseDocxText(result.value, file.name);

    const tagNames = parsed.tags;
    await prisma.recipe.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        ingredients: parsed.ingredients || "See document",
        instructions: parsed.instructions || "See document",
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
    count++;
  }

  return NextResponse.json({ count });
}
