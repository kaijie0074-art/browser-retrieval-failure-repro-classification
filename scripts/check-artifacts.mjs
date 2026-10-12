import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios } from './scenario-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'package.json',
  'docs/failure-taxonomy.md',
  'docs/open-source-references.md',
  'docs/repair-references.md',
  'docs/templates/issue-report-template.md',
  'fixtures/search-fixture-server.mjs',
  'scripts/reproduce.mjs',
  'scripts/run-regression.mjs',
  'evidence/latest-run.json',
];

for (const relativePath of requiredFiles) {
  await fs.access(path.join(root, relativePath));
}

const taxonomy = await fs.readFile(path.join(root, 'docs/failure-taxonomy.md'), 'utf8');
for (const category of ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08']) {
  if (!taxonomy.includes(category)) throw new Error(`分类缺失：${category}`);
}

const repairReferences = await fs.readFile(path.join(root, 'docs/repair-references.md'), 'utf8');
for (const fixId of ['FIX-001', 'FIX-002', 'FIX-003', 'FIX-004', 'FIX-005', 'FIX-006']) {
  if (!repairReferences.includes(fixId)) throw new Error(`修复引用缺失：${fixId}`);
}

const evidence = JSON.parse(await fs.readFile(path.join(root, 'evidence/latest-run.json'), 'utf8'));
if (evidence.scenarioCount !== scenarios.length) throw new Error('证据场景数量与场景目录不一致');
const evidenceIds = new Set(evidence.results.map((result) => result.scenario));
for (const scenario of scenarios) {
  if (!evidenceIds.has(scenario.id)) throw new Error(`证据缺少场景：${scenario.id}`);
}

const markdownFiles = [];
async function collect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'generated') await collect(entryPath);
    if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(entryPath);
  }
}
await collect(root);
const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
for (const markdownFile of markdownFiles) {
  const content = await fs.readFile(markdownFile, 'utf8');
  for (const match of content.matchAll(linkPattern)) {
    const target = match[1].split('#')[0];
    if (!target || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:')) continue;
    const resolved = path.resolve(path.dirname(markdownFile), target);
    try {
      await fs.access(resolved);
    } catch {
      throw new Error(`Markdown 链接不存在：${path.relative(root, markdownFile)} -> ${target}`);
    }
  }
}

const allText = await Promise.all(markdownFiles.map((file) => fs.readFile(file, 'utf8')));
const sensitivePattern = /(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{20,})/;
if (sensitivePattern.test(allText.join('\n'))) throw new Error('发现疑似凭据文本');

console.log(`完整性检查通过：${requiredFiles.length} 个核心文件、${markdownFiles.length} 个 Markdown 文件、${scenarios.length} 个场景`);
