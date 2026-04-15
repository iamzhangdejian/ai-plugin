import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const SRC_INDEX = resolve(ROOT_DIR, 'index.html');
const DEST_INDEX = resolve(ROOT_DIR, 'dist', 'index.html');

// 确保输出目录存在
if (!existsSync(resolve(ROOT_DIR, 'dist'))) {
  mkdirSync(resolve(ROOT_DIR, 'dist'), { recursive: true });
}

// 读取原始 index.html
let content = readFileSync(SRC_INDEX, 'utf-8');

// 替换脚本引用：从 /src/index.ts 改为 /ai-robot.js
content = content.replace(
  '<script type="module" src="/src/index.ts"></script>',
  '<script type="module" src="/ai-robot.js"></script>'
);

// 移除 Vite 客户端脚本（如果存在）
content = content.replace(
  /<script type="module" src="\/@vite\/client"><\/script>/g,
  ''
);

// Three.js 已经打包进库文件，不需要额外 CDN

// 写入新的 index.html
writeFileSync(DEST_INDEX, content, 'utf-8');

console.log('✅ Build complete!');
console.log('📦 Output directory: dist/');
console.log('📄 Files:');
console.log('   - ai-robot.js (library with Three.js bundled)');
console.log('   - ai-robot.js.map (source map)');
console.log('   - index.html (demo site)');
