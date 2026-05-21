import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

async function buildPdf(recipe: {
  title: string;
  description?: string | null;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  ingredients: string;
  instructions: string;
  tags: { tag: { name: string } }[];
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;
  const left = 50;
  const lineH = 18;

  const write = (text: string, size: number, font = regular, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(text, { x: left, y, size, font, color });
    y -= lineH * (size / 12);
  };

  const line = () => {
    page.drawLine({ start: { x: left, y }, end: { x: width - left, y }, thickness: 0.5, color: rgb(0.8, 0.6, 0.2) });
    y -= 10;
  };

  write(recipe.title, 22, bold, rgb(0.55, 0.35, 0.05));
  y -= 4;
  line();

  if (recipe.description) { write(recipe.description, 11); y -= 4; }

  const meta = [
    recipe.prepTime ? `Prep: ${recipe.prepTime} min` : null,
    recipe.cookTime ? `Cook: ${recipe.cookTime} min` : null,
    recipe.servings ? `Serves: ${recipe.servings}` : null,
  ].filter(Boolean).join("  |  ");
  if (meta) { write(meta, 10, regular, rgb(0.5, 0.5, 0.5)); y -= 4; }

  if (recipe.tags.length) {
    write("Tags: " + recipe.tags.map(({ tag }) => tag.name).join(", "), 10, regular, rgb(0.5, 0.5, 0.5));
  }

  y -= 8;
  write("INGREDIENTS", 13, bold, rgb(0.55, 0.35, 0.05));
  y -= 2;
  for (const ing of recipe.ingredients.split("\n").filter(Boolean)) {
    if (y < 60) break;
    write(`• ${ing}`, 11);
  }

  y -= 8;
  write("INSTRUCTIONS", 13, bold, rgb(0.55, 0.35, 0.05));
  y -= 2;
  const steps = recipe.instructions.split("\n").filter(Boolean);
  for (let i = 0; i < steps.length; i++) {
    if (y < 60) break;
    const words = steps[i];
    const maxChars = 85;
    const chunks = [];
    for (let j = 0; j < words.length; j += maxChars) chunks.push(words.slice(j, j + maxChars));
    write(`${i + 1}. ${chunks[0]}`, 11);
    for (let k = 1; k < chunks.length; k++) { if (y < 60) break; write(`   ${chunks[k]}`, 11); }
  }

  return doc.save();
}

function buildDocx(recipe: {
  title: string;
  description?: string | null;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  ingredients: string;
  instructions: string;
  tags: { tag: { name: string } }[];
}) {
  const meta = [
    recipe.prepTime ? `Prep: ${recipe.prepTime} min` : null,
    recipe.cookTime ? `Cook: ${recipe.cookTime} min` : null,
    recipe.servings ? `Serves: ${recipe.servings}` : null,
  ].filter(Boolean).join("  |  ");

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: recipe.title, heading: HeadingLevel.HEADING_1 }),
        ...(recipe.description ? [new Paragraph({ text: recipe.description })] : []),
        ...(meta ? [new Paragraph({ children: [new TextRun({ text: meta, color: "888888", size: 20 })] })] : []),
        ...(recipe.tags.length ? [new Paragraph({ children: [new TextRun({ text: "Tags: " + recipe.tags.map(({ tag }) => tag.name).join(", "), color: "888888", size: 20 })] })] : []),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Ingredients", heading: HeadingLevel.HEADING_2 }),
        ...recipe.ingredients.split("\n").filter(Boolean).map((ing) =>
          new Paragraph({ text: `• ${ing}`, alignment: AlignmentType.LEFT })
        ),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Instructions", heading: HeadingLevel.HEADING_2 }),
        ...recipe.instructions.split("\n").filter(Boolean).map((step, i) =>
          new Paragraph({ text: `${i + 1}. ${step}` })
        ),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") ?? "pdf";

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = recipe.title.replace(/[^a-z0-9]+/gi, "_").toLowerCase();

  if (format === "docx") {
    const buffer = await buildDocx(recipe);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${slug}.docx"`,
      },
    });
  }

  const bytes = await buildPdf(recipe);
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
    },
  });
}
