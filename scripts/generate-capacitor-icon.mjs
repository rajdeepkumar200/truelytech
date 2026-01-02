import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const projectRoot = process.cwd();
const svgPath = path.join(projectRoot, 'public', 'favicon.svg');
const outDir = path.join(projectRoot, 'capacitor-assets');
const outPngPath = path.join(outDir, 'icon.png');

const svg = await fs.readFile(svgPath, 'utf8');
await fs.mkdir(outDir, { recursive: true });

const resvg = new Resvg(svg, {
  fitTo: {
    mode: 'width',
    value: 1024,
  },
});

const pngData = resvg.render().asPng();
await fs.writeFile(outPngPath, pngData);

console.log(`Wrote ${path.relative(projectRoot, outPngPath)}`);
