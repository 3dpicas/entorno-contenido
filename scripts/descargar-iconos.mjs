import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Por defecto solo baja los iconos que faltan. Los que ya están se revisaron a
// mano uno a uno, y alguno (solitario.png) está dibujado aquí porque su web no
// publica favicon: volver a bajarlos los machacaría en silencio.
// Para rehacerlos todos a propósito: node scripts/descargar-iconos.mjs --forzar
const forzar = process.argv.includes('--forzar');

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(raiz, 'manifest.json'), 'utf8'));
const tarjetas = manifest.secciones.flatMap((s) =>
  (s.tarjetas ?? []).concat((s.grupos ?? []).flatMap((g) => g.tarjetas)));

let fallos = 0;
const hechos = new Set();
for (const t of tarjetas.filter((t) => t.tipo === 'enlace' && t.icono)) {
  if (hechos.has(t.icono)) continue;
  hechos.add(t.icono);

  const destino = join(raiz, 'iconos', t.icono);
  if (!forzar && existsSync(destino)) {
    console.log(`ya existe, se conserva: ${t.icono}`);
    continue;
  }

  const dominio = new URL(t.url).hostname;
  const resp = await fetch(`https://www.google.com/s2/favicons?domain=${dominio}&sz=128`);
  if (!resp.ok) {
    console.warn(`sin favicon: ${dominio}`);
    fallos++;
    continue;
  }
  const datos = Buffer.from(await resp.arrayBuffer());
  writeFileSync(destino, datos);
  console.log(`descargado: ${t.icono} (${datos.length} bytes, ${dominio})`);
}
if (fallos) console.warn(`${fallos} iconos no se pudieron descargar`);
