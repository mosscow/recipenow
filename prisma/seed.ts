import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import path from "path";
import fs from "fs";

const dbPath = path.resolve("dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);
const anthropic = new Anthropic();

function parseDocxText(text: string, filename: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let title = filename.replace(/\.docx$/i, "").replace(/_/g, " ");
  let description = "";
  const ingredientLines: string[] = [];
  const instructionLines: string[] = [];
  let section: "none" | "ingredients" | "instructions" = "none";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(recipe\s*name|title)\s*[:\-]?\s*/i.test(line)) {
      title = line.replace(/^(recipe\s*name|title)\s*[:\-]?\s*/i, "").trim() || title;
      continue;
    }
    if (/^(description|about)\s*[:\-]?\s*/i.test(line)) {
      description = line.replace(/^(description|about)\s*[:\-]?\s*/i, "").trim();
      continue;
    }
    if (/^ingredients?$/i.test(lower)) { section = "ingredients"; continue; }
    if (/^(instructions?|method|directions?|steps?|preparation)$/i.test(lower)) { section = "instructions"; continue; }

    if (section === "ingredients") ingredientLines.push(line.replace(/^[-•*]\s*/, ""));
    else if (section === "instructions") instructionLines.push(line.replace(/^\d+[.)]\s*/, ""));
  }

  if (ingredientLines.length === 0 && instructionLines.length === 0) {
    const half = Math.floor(lines.length / 2);
    ingredientLines.push(...lines.slice(0, half));
    instructionLines.push(...lines.slice(half));
  }

  return { title, description, ingredients: ingredientLines.join("\n"), instructions: instructionLines.join("\n") };
}

async function parseImageRecipe(imagePath: string, filename: string) {
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString("base64");
  const ext = path.extname(filename).toLowerCase().slice(1);
  const mediaType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";

  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Extract the recipe from this image and return ONLY a JSON object with these fields:
{
  "title": "recipe name",
  "description": "brief description or empty string",
  "ingredients": "one ingredient per line",
  "instructions": "one step per line"
}
If any field is not visible, use an empty string. Return only the JSON, no other text.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || filename.replace(/\.[^.]+$/, "").replace(/_/g, " "),
      description: parsed.description || "",
      ingredients: parsed.ingredients || "See original image",
      instructions: parsed.instructions || "See original image",
    };
  } catch {
    const fallbackTitle = filename.replace(/\.[^.]+$/, "").replace(/_/g, " ");
    return { title: fallbackTitle, description: "", ingredients: text, instructions: "" };
  }
}

async function upsertTag(name: string) {
  return (prisma as any).tag.upsert({ where: { name }, update: {}, create: { name } });
}

async function scanDir(dir: string, extraTags: string[] = []) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // subfolder name becomes a tag
      await scanDir(path.join(dir, entry.name), [...extraTags, entry.name.toLowerCase()]);
    } else if (entry.name.endsWith(".docx")) {
      const buffer = fs.readFileSync(path.join(dir, entry.name));
      const { value } = await mammoth.extractRawText({ buffer });
      const parsed = parseDocxText(value, entry.name);

      const existing = await (prisma as any).recipe.findFirst({ where: { title: parsed.title } });
      if (existing) { console.log(`Skipped (exists): ${parsed.title}`); continue; }

      const tags = await Promise.all(extraTags.map(upsertTag));

      await (prisma as any).recipe.create({
        data: {
          title: parsed.title,
          description: parsed.description || undefined,
          ingredients: parsed.ingredients || "See original document",
          instructions: parsed.instructions || "See original document",
          tags: { create: tags.map((t: any) => ({ tagId: t.id })) },
        },
      });
      console.log(`Imported: ${parsed.title} [${extraTags.join(", ")}]`);
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      console.log(`Processing image: ${entry.name} ...`);
      const parsed = await parseImageRecipe(path.join(dir, entry.name), entry.name);

      const existing = await (prisma as any).recipe.findFirst({ where: { title: parsed.title } });
      if (existing) { console.log(`Skipped (exists): ${parsed.title}`); continue; }

      const tags = await Promise.all(extraTags.map(upsertTag));

      await (prisma as any).recipe.create({
        data: {
          title: parsed.title,
          description: parsed.description || undefined,
          ingredients: parsed.ingredients || "See original image",
          instructions: parsed.instructions || "See original image",
          tags: { create: tags.map((t: any) => ({ tagId: t.id })) },
        },
      });
      console.log(`Imported: ${parsed.title} [${extraTags.join(", ")}]`);
    }
  }
}

async function main() {
  const examplesDir = path.join(process.cwd(), "examples");
  // Root-level files get no auto-tags
  await scanDir(examplesDir);
  await (prisma as any).$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
