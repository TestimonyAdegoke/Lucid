import { db } from "@tardemah/database";
import { route } from "@/lib/api";
import { serializeDream } from "@/lib/dreams";
import { getRequestContext } from "@/lib/session";

export const runtime = "nodejs";

/** Downloads every page the caller wrote, across all their dream books. Dreams belong to the dreamer. */
export const GET = route("export", async (request: Request) => {
  const context = await getRequestContext(request);
  const format = new URL(request.url).searchParams.get("format") === "markdown" ? "markdown" : "json";

  const dreams = await db.dream.findMany({
    where: { authorId: context.userId },
    include: { dreamTags: { include: { tag: true } }, workspace: { select: { name: true } } },
    orderBy: { dreamedAt: "asc" },
  });

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "markdown") {
    const body = dreams.map((dream) => {
      const meta = [
        dream.dreamedAt.toISOString().slice(0, 10),
        dream.workspace.name,
        dream.mood && "mood: " + dream.mood,
        dream.isLucid && "lucid",
        dream.isNightmare && "nightmare",
      ].filter(Boolean).join(" · ");
      const tags = dream.dreamTags.map((item) => "#" + item.tag.name).join(" ");
      return "## " + dream.title + "\n\n_" + meta + "_\n\n" + dream.content + (tags ? "\n\n" + tags : "");
    }).join("\n\n---\n\n");

    return new Response("# My Lucid dream book\n\n" + body + "\n", {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="tardemah-dreams-${stamp}.md"`,
      },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    dreams: dreams.map((dream) => ({ ...serializeDream(dream, context.userId), dreamBook: dream.workspace.name })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tardemah-dreams-${stamp}.json"`,
    },
  });
});
