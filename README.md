# El Rosco

Juego de palabras para el celular: juegos previos aleatorios que suman segundos y un rosco final de 25 letras.

- **Jugar solo**: modo escribir o modo presentador.
- **Jugar en familia**: un teléfono crea la sala (código de 4 letras o QR) y los demás se unen desde el enlace. Todos responden a la vez; en cada ronda se elimina a los últimos (con desempate) hasta que quedan 2 para el rosco final por turnos.
- **Voz**: las consignas se leen en voz alta (configurable: solo en el anfitrión o en todos los teléfonos).

La conexión entre teléfonos es directa (WebRTC con PeerJS); el servidor público de PeerJS solo se usa para el primer contacto, así que se necesita internet. El teléfono anfitrión debe mantener la pantalla encendida.

## Instalar en el teléfono
Enlace: https://pablomauch.github.io/rosco/

- **iPhone / iPad:** abrir el enlace en Safari → Compartir → «Agregar a pantalla de inicio».
- **Android:** abrir el enlace en Chrome → botón «Instalar la app» en el inicio (o menú ⋮ → «Instalar app»). Manteniendo presionado el ícono aparecen accesos directos a Jugar solo y Jugar en familia.

Instalada, se abre a pantalla completa como una app. El modo solo funciona sin internet; el modo en familia necesita conexión. En Android, el botón «atrás» pausa la partida o vuelve al inicio en lugar de cerrar la app.

## Publicar en GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.

## Contenido
- `data.json`: banco editable (roscos, Una de cuatro, La pista, Encadenadas, Letras desordenadas).
- `tools/validar.py`: valida letras, sílabas y que ninguna respuesta se repita, y genera `data.js`.
  ```
  python3 tools/validar.py
  ```
- Al publicar una tanda nueva, sube `CACHE` en `sw.js` (por ejemplo `rosco-v2`) para que el teléfono la descargue.

Los roscos jugados quedan guardados en el teléfono y no se repiten; la pantalla de inicio muestra cuántos quedan por nivel.
