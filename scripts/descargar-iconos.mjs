import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(raiz, 'manifest.json'), 'utf8'));
const tarjetas = manifest.secciones.flatMap((s) =>
  (s.tarjetas ?? []).concat((s.grupos ?? []).flatMap((g) => g.tarjetas)));

let fallos = 0;
for (const t of tarjetas.filter((t) => t.tipo === 'enlace' && t.icono)) {
  const dominio = new URL(t.url).hostname;
  const resp = await fetch(`https://www.google.com/s2/favicons?domain=${dominio}&sz=128`);
  if (!resp.ok) {
    console.warn(`sin favicon: ${dominio}`);
    fallos++;
    continue;
  }
  const datos = Buffer.from(await resp.arrayBuffer());
  writeFileSync(join(raiz, 'iconos', t.icono), datos);
  console.log(`descargado: ${t.icono} (${datos.length} bytes, ${dominio})`);
}
if (fallos) console.warn(`${fallos} iconos no se pudieron descargar`);
