import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(raiz, 'manifest.json'), 'utf8'));
const schema = JSON.parse(readFileSync(join(raiz, 'schema/manifest.schema.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true });
if (!ajv.validate(schema, manifest)) {
  console.error('manifest.json no cumple el schema:');
  console.error(ajv.errors);
  process.exit(1);
}

const errores = [];
const tarjetas = manifest.secciones.flatMap(s =>
  (s.tarjetas ?? []).concat((s.grupos ?? []).flatMap(g => g.tarjetas)));

for (const t of tarjetas) {
  if (t.tipo === 'guia') {
    const ruta = join(raiz, t.guia);
    if (!existsSync(ruta)) errores.push(`guía no existe: ${t.guia}`);
    else if (!/^##\s+Paso/im.test(readFileSync(ruta, 'utf8')))
      errores.push(`guía sin pasos (## Paso ...): ${t.guia}`);
  }
  if (t.icono && !existsSync(join(raiz, 'iconos', t.icono)))
    errores.push(`icono no existe: iconos/${t.icono}`);
}
for (const s of manifest.secciones)
  if (s.icono && !existsSync(join(raiz, 'iconos', s.icono)))
    errores.push(`icono no existe: iconos/${s.icono}`);

if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
console.log('Contenido OK');
