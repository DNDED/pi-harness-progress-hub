import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const entryPoint = path.join(rootDir, 'src', 'remotion', 'index.tsx');
const outDir = path.join(rootDir, 'out');
const outputFile = path.join(outDir, 'progress-reel.mp4');

async function main() {
  console.log('Bundling Remotion video composition...');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const bundled = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log('Selecting composition ProgressReel...');
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'ProgressReel',
  });

  console.log(`Rendering Remotion video to ${outputFile}... (${composition.durationInFrames} frames)`);
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputFile,
  });

  console.log('Video render completed successfully:', outputFile);
}

main().catch((err) => {
  console.error('Video render failed:', err);
  process.exit(1);
});
