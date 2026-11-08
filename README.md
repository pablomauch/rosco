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
- `tools/banco/rosco_1.txt`, `rosco_2.txt`, `rosco_3.txt`: palabras del rosco por nivel (`LETRA|e/c|definición|respuesta;alternativa`), 14 por letra y nivel. El rosco se arma en el momento, letra por letra.
- `tools/banco/previos.txt`: preguntas de los 8 juegos previos.
- `python3 tools/generar_banco.py && python3 tools/validar.py`: genera `data.json` y `data.js`, y verifica que ninguna palabra se repita en todo el banco.
- El historial es por palabra y con fecha. En el modo familia, los teléfonos de la sala comparten su historial.
- Al publicar contenido nuevo, sube `CACHE` en `sw.js` para que los teléfonos lo descarguen.
