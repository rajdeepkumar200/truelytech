import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const projectRoot = process.cwd();
const svgPath = path.join(projectRoot, 'public', 'favicon.svg');

const outputs = [
  { size: 192, out: path.join(projectRoot, 'public', 'pwa-192x192.png') },
  { size: 512, out: path.join(projectRoot, 'public', 'pwa-512x512.png') },
];

const svg = await fs.readFile(svgPath, 'utf8');

for (const { size, out } of outputs) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size,
    },
  });

  const pngData = resvg.render().asPng();
  await fs.writeFile(out, pngData);
  console.log(`Wrote ${path.relative(projectRoot, out)}`);
}
