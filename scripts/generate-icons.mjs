import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "public");
const iconsDir = path.join(root, "icons");
const source = path.join(process.cwd(), "scripts", "icon-source.svg");

async function generate() {
  await mkdir(iconsDir, { recursive: true });
  const svg = await readFile(source);

  const sizes = [
    { file: "icons/icon-192x192.png", size: 192 },
    { file: "icons/icon-512x512.png", size: 512 },
    { file: "icons/maskable-icon-512x512.png", size: 512, maskable: true },
    { file: "apple-touch-icon.png", size: 180 },
    { file: "favicon-32x32.png", size: 32 },
  ];

  for (const { file, size, maskable } of sizes) {
    let pipeline = sharp(svg).resize(size, size);

    if (maskable) {
      pipeline = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 10, g: 10, b: 10, alpha: 1 },
        },
      }).composite([
        {
          input: await sharp(svg).resize(Math.round(size * 0.62)).png().toBuffer(),
          gravity: "center",
        },
      ]);
    }

    await pipeline.png().toFile(path.join(root, file));
  }

  await sharp(svg).resize(32, 32).png().toFile(path.join(root, "favicon.ico"));

  console.log("PWA icons generated in public/");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
