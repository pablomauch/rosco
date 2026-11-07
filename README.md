# El Rosco

Juego de palabras para el celular: juegos previos aleatorios que suman segundos y un rosco final de 25 letras.

## Publicar en GitHub Pages
1. Crea el repo `rosco` en GitHub y sube todos estos archivos a la raíz.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
3. Abre `https://<usuario>.github.io/rosco/` en Safari → Compartir → **Agregar a pantalla de inicio**.

## Contenido
- `data.json`: banco editable (roscos, Una de cuatro, La pista, Encadenadas, Letras desordenadas).
- `tools/validar.py`: valida letras, sílabas y que ninguna respuesta se repita, y genera `data.js`.
  ```
  python3 tools/validar.py
  ```
- Al publicar una tanda nueva, sube `CACHE` en `sw.js` (por ejemplo `rosco-v2`) para que el teléfono la descargue.

Los roscos jugados quedan guardados en el teléfono y no se repiten; la pantalla de inicio muestra cuántos quedan por nivel.
