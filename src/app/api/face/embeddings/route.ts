import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "embeddings.json");

export async function POST(req: any) {
  try {
    const body = await req.json();
    const image = body?.image;
    if (!image) {
      return new Response(JSON.stringify({ error: "Missing image" }), {
        status: 400,
      });
    }

    // Load existing embeddings
    let embeddings: any[] = [];
    try {
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, "utf8");
        embeddings = raw ? JSON.parse(raw) : [];
      }
    } catch {
      embeddings = [];
    }

    // Create new entry
    const id = `emb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const entry = { id, image, timestamp: Date.now() };
    embeddings.push(entry);

    // Persist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFile, JSON.stringify(embeddings, null, 2));

    return new Response(JSON.stringify({ id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
