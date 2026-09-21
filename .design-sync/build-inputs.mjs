// Gera dist/ (entry, .d.ts, styles.css) para o design-sync a partir do fonte do app.
// Rodar da raiz do repo antes de .ds-sync/package-build.mjs.
import { execSync } from 'node:child_process';
import {
    readdirSync,
    readFileSync,
    writeFileSync,
    rmSync,
    mkdirSync,
    cpSync,
    existsSync,
} from 'node:fs';
import { join } from 'node:path';

const comps = 'resources/js/components';
const files = [];
for (const d of ['', 'ui']) {
    for (const f of readdirSync(join(comps, d)).sort()) {
        if (f.endsWith('.tsx')) files.push(join(d, f).replace(/\.tsx$/, ''));
    }
}
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/component-docs', { recursive: true });

// exports nomeados e default de cada arquivo -> entry/index.d.ts + grupo (category) por arquivo.
const pascal = /^[A-Z][A-Za-z0-9]*$/;
const entryLines = [];
const dtsLines = [];
function register(src, entryPath, dtsPath, group) {
    const names = new Set();
    for (const m of src.matchAll(/export\s+\{([^}]*)\}/g)) {
        for (const n of m[1].split(','))
            names.add(
                n
                    .trim()
                    .split(/\s+as\s+/)
                    .pop(),
            );
    }
    for (const m of src.matchAll(/export\s+(?:function|const|class)\s+(\w+)/g))
        names.add(m[1]);
    entryLines.push(`export * from '${entryPath}';`);
    dtsLines.push(`export * from '${dtsPath}';`);
    const def =
        /export\s+default\s+(?:function|class)\s+(\w+)/.exec(src)?.[1] ??
        /export\s+default\s+(\w+);/.exec(src)?.[1];
    if (def) {
        names.add(def);
        entryLines.push(`export { default as ${def} } from '${entryPath}';`);
        dtsLines.push(`export { default as ${def} } from '${dtsPath}';`);
    }
    for (const n of names) {
        if (pascal.test(n))
            writeFileSync(
                `dist/component-docs/${n}.md`,
                `---\ncategory: ${group}\n---\n`,
            );
    }
}
const titleCase = (base) =>
    base.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

// i18n real (pt-BR) no bundle: sem isso os componentes de app mostram a chave crua (ex.: settings:deleteAccount.warning).
entryLines.push("import '../.design-sync/i18n-init';");

for (const f of files) {
    const src = readFileSync(join(comps, `${f}.tsx`), 'utf8');
    const base = f.split('/').pop();
    // .design-sync/shims/<nome>.tsx substitui o arquivo do app no bundle (ex.: asset com caminho absoluto).
    const shim = `.design-sync/shims/${base}.tsx`;
    register(
        src,
        existsSync(shim) ? `../.design-sync/shims/${base}` : `../${comps}/${f}`,
        `./components/${f}`,
        f.startsWith('ui/') ? titleCase(base) : 'App',
    );
}

// Componentes que só existem no design system (não fazem parte do app): .design-sync/components/*.tsx
const dsDir = '.design-sync/components';
const dsFiles = readdirSync(dsDir)
    .filter((f) => f.endsWith('.tsx'))
    .sort();
for (const f of dsFiles) {
    const base = f.replace(/\.tsx$/, '');
    register(
        readFileSync(join(dsDir, f), 'utf8'),
        `../${dsDir}/${base}`,
        `./ds/${base}`,
        titleCase(base),
    );
}
writeFileSync('dist/entry.ts', entryLines.join('\n') + '\n');
try {
    execSync('pnpm exec tsc -p .design-sync/tsconfig.dts.json', {
        stdio: 'inherit',
    });
} catch {
    /* declaration emit continues past type errors */
}
try {
    execSync('pnpm exec tsc -p .design-sync/tsconfig.dts-ds.json', {
        stdio: 'ignore',
    });
} catch {
    /* TS6059 (rootDir vs button.tsx importado) é esperado; os .d.ts saem mesmo assim */
}
writeFileSync('dist/types/index.d.ts', dtsLines.join('\n') + '\n');
execSync(
    '.ds-sync/node_modules/.bin/tailwindcss -i .design-sync/tailwind-input.css -o dist/styles.css',
    { stdio: 'inherit' },
);
// @font-face do fontsource usa url(./files/*.woff2) relativo ao CSS compilado.
mkdirSync('dist/files', { recursive: true });
for (const p of ['outfit', 'raleway']) {
    const dir = `node_modules/@fontsource-variable/${p}/files`;
    for (const f of readdirSync(dir))
        if (f.endsWith('.woff2')) cpSync(join(dir, f), join('dist/files', f));
}
// O conversor espera um "pacote" com nome; dist/ faz esse papel (o package.json da raiz não tem name).
writeFileSync(
    'dist/package.json',
    JSON.stringify(
        {
            name: 'upay',
            version: '0.0.0',
            types: 'types/index.d.ts',
            module: 'entry.ts',
        },
        null,
        2,
    ),
);
