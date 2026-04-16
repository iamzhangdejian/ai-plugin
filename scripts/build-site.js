import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, lstatSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const SRC_INDEX = resolve(ROOT_DIR, 'index.html');
const DEST_INDEX = resolve(ROOT_DIR, 'dist', 'index.html');
const SITE_DIR = resolve(ROOT_DIR, 'site');
const DIST_SITE_DIR = resolve(ROOT_DIR, 'dist', 'site');

// 确保输出目录存在
if (!existsSync(resolve(ROOT_DIR, 'dist'))) {
  mkdirSync(resolve(ROOT_DIR, 'dist'), { recursive: true });
}

// 复制 site 目录到 dist
if (existsSync(SITE_DIR)) {
  if (!existsSync(DIST_SITE_DIR)) {
    mkdirSync(DIST_SITE_DIR, { recursive: true });
  }

  // 递归复制 site 目录下的所有文件
  function copyDir(src, dest) {
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        if (!existsSync(destPath)) {
          mkdirSync(destPath, { recursive: true });
        }
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(SITE_DIR, DIST_SITE_DIR);
  console.log('📁 Copied site/ to dist/site/');
}

// 读取原始 index.html
let content = readFileSync(SRC_INDEX, 'utf-8');

// 替换脚本引用：从 /src/index.ts 改为 /ai-robot.js
content = content.replace(
  '<script type="module" src="/src/index.ts"></script>',
  '<script type="module" src="/ai-robot.js"></script>'
);

// 替换 CSS 和 JS 路径为相对路径（用于生产环境）
content = content.replace(
  'href="/site/styles/index.css"',
  'href="/site/styles/index.css"'
);
content = content.replace(
  'src="/site/scripts/main.js"',
  'src="/site/scripts/main.js"'
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
console.log('   - site/styles/index.css (demo site styles)');
console.log('   - site/scripts/main.js (demo site logic)');
