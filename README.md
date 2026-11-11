# Sistema de reserva de equipos informáticos
 
Práctica de las UD2 y UD3 de **Desarrollo Web en Entorno Servidor (DWES)**.
 
Aplicación web para reservar los equipos informáticos de un centro educativo, hecha con **Node.js, Express, EJS y JavaScript**, con el núcleo de reservas también en **TypeScript**.
 
- **Visitantes**: consultan el catálogo de equipos y lo filtran por tipo y estado.
- **Usuarios**: se registran, reservan un equipo para una fecha y un turno (mañana o tarde), consultan sus reservas y las cancelan.
- **Administradores**: añaden equipos, los marcan como operativos o fuera de servicio y consultan o cancelan cualquier reserva.
---
 
## 1. Puesta en marcha
 
Requisitos: Node.js 22 o 24. En Windows, usar **Git Bash**.
 
```bash
git clone <URL-del-repositorio>
cd reserva-equipos
npm install
```
 
Crear el archivo `.env` con un secreto de sesión aleatorio. Este archivo no se sube a GitHub; `.env.example` muestra su formato:
 
```bash
printf 'PORT=3000\nNODE_ENV=development\nSESSION_SECRET=%s\n' "$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")" > .env
```
 
Arrancar y abrir <http://localhost:3000>:
 
```bash
npm start
```
 
Si `PORT`, `NODE_ENV` o `SESSION_SECRET` no son válidos (por ejemplo, un secreto de menos de 32 caracteres), el servidor no arranca.
 
| Rol | Correo | Contraseña |
|---|---|---|
| admin | `admin@example.com` | `Admin1234` |
| usuario | `ana@example.com` | `Ana12345` |
| usuario | `luis@example.com` | `Luis1234` |
 
Los datos están en memoria y vuelven al estado inicial cada vez que se reinicia el servidor.
 
## 2. Pruebas y TypeScript
 
```bash
npm test            # 14 pruebas con Vitest y Supertest (no hace falta arrancar el servidor)
npm run check:ts    # comprueba los tipos (strict: true, sin any)
npm run build:ts    # compila src-ts/ en dist/
npm run demo:ts     # ejecuta la demostración del núcleo tipado
```
 
Las 10 pruebas del enunciado están en `tests/auth.test.js` (1, 2, 3, 4 y 10), `tests/reservas.test.js` (6, 7 y 8) y `tests/admin.test.js` (5 y 9).
 
---
 
## 3. Estructura
 
```
src/
├── server.js        Arranca el servidor (listen). Solo eso
├── app.js           Crea la app Express y conecta repositorios → servicios → controladores
├── config/          Validación de variables de entorno y opciones de sesión
├── data/            Datos iniciales (3 equipos, 3 usuarios, 4 reservas)
├── repositories/    Acceso a los datos en memoria (Map)
├── domain/          Reglas puras: estaReservado, obtenerEquiposDisponibles, validarReserva...
├── services/        Reglas de negocio, sin req, res ni EJS
├── controllers/     Leen la petición, llaman al servicio y responden
├── routes/          URL + middlewares + controlador
├── middlewares/     Autenticación, roles, CSRF, límite de login, avisos y errores
└── presentation/    Modelo de vista del formulario y helpers
views/               Plantillas EJS con parciales
src-ts/              Núcleo tipado: interfaces, RepositorioReservas, clase con Map y servicio
tests/               Pruebas automatizadas
```
 
Cada petición sigue el camino **ruta → controlador → servicio → repositorio**. Las reglas (disponibilidad, conflictos, cancelaciones) están en los servicios, no en las rutas ni en las vistas.
 
## 4. Cómo funciona
 
- **Catálogo**: `/equipos` filtra con `?tipo=` y `?operativos=true`; `/equipos/:id` muestra la ficha.
- **Registro y login**: contraseñas con `bcrypt`. El registro asigna siempre el rol `usuario`. Un login fallido devuelve `401` con el mismo mensaje exista o no el correo. Al entrar se regenera la sesión y solo se guarda `usuarioId`; al salir se destruye la sesión y se borra la cookie.
- **Reservas**: el formulario pide primero fecha y turno y después ofrece solo los equipos libres. El servidor repite todas las comprobaciones en el `POST`. Si todo va bien, responde `303` y muestra un aviso de un solo uso.
- **Cancelación**: solo las reservas propias, activas y futuras. La reserva cambia a `cancelada`, no se borra, y el hueco queda libre.
- **Administración**: las rutas `/admin/...` exigen el rol `admin`, que se lee del servidor y nunca de una cookie.
- **Cookies y sesión**: la cookie `tipoPreferido` guarda el filtro inicial del catálogo. La sesión (`httpOnly`, `sameSite: lax`, `secure` en producción, 30 minutos) guarda la identidad, el token CSRF y los avisos.
- **Seguridad**: token CSRF en todos los formularios autenticados, incluido el logout. Límite de 10 intentos de login cada 15 minutos. Errores centralizados sin trazas.
- **Códigos HTTP**: `400` datos incorrectos, `401` credenciales incorrectas, `403` sin permiso o token CSRF inválido, `404` no existe, `409` equipo ya reservado, `303` redirección.
---
 
## 5. Ejemplos con curl
 
Ejecutar en orden, con el servidor recién arrancado y en Git Bash. `-c` y `-b` guardan y reenvían las cookies, como haría el navegador. El token CSRF se saca del HTML de `/perfil`.
 
```bash
BASE=http://localhost:3000
 
# Catálogo (público)
curl -i "$BASE/equipos?tipo=portatil&operativos=true"         # 200
curl -i "$BASE/equipos/1"                                      # 200
curl -i "$BASE/equipos/99"                                     # 404
 
# Cookie de preferencias
curl -i -c cookies.txt -b cookies.txt -d "tipo=portatil" "$BASE/preferencias/tipo"   # 303
 
# Registro (el campo rol se ignora)
curl -i -d "nombre=Marta" -d "email=marta@example.com" -d "password=Marta1234" -d "rol=admin" "$BASE/registro"  # 303
 
# Login incorrecto y ruta privada sin sesión
curl -i -d "email=ana@example.com" -d "password=mala" "$BASE/login"    # 401
curl -i "$BASE/perfil"                                                 # 303 a /login
 
# Login como Ana y token CSRF
curl -i -c cookies.txt -b cookies.txt -d "email=ana@example.com" -d "password=Ana12345" "$BASE/login"   # 303
TOKEN=$(curl -s -c cookies.txt -b cookies.txt "$BASE/perfil" | grep -o 'name="_csrf" value="[^"]*"' | head -n 1 | cut -d '"' -f 4)
 
# Reservas
curl -s -b cookies.txt "$BASE/reservas/nueva?fecha=2027-01-15&turno=manana" | grep "<option"           # equipos libres
curl -i -b cookies.txt -d "_csrf=$TOKEN" -d "equipoId=2" -d "fecha=2027-02-01" -d "turno=manana" "$BASE/reservas"   # 303
curl -i -b cookies.txt -d "_csrf=$TOKEN" -d "equipoId=2" -d "fecha=2027-02-01" -d "turno=manana" "$BASE/reservas"   # 409 duplicada
curl -i -b cookies.txt -d "equipoId=1" -d "fecha=2027-02-01" -d "turno=tarde" "$BASE/reservas"                      # 403 sin token
curl -i -b cookies.txt "$BASE/mis-reservas"                                                           # 200
 
# Cancelar
curl -i -b cookies.txt -d "_csrf=$TOKEN" "$BASE/reservas/2/cancelar"    # 403, es de Luis
curl -i -b cookies.txt -d "_csrf=$TOKEN" "$BASE/reservas/1/cancelar"    # 303, es de Ana
 
# Un usuario normal no puede administrar
curl -i -b cookies.txt "$BASE/admin/equipos"                            # 403
 
# Logout
curl -i -c cookies.txt -b cookies.txt -d "_csrf=$TOKEN" "$BASE/logout"   # 303
curl -i -b cookies.txt "$BASE/perfil"                                   # 303, la sesión ya no vale
 
# Administración
curl -i -c admin.txt -b admin.txt -d "email=admin@example.com" -d "password=Admin1234" "$BASE/login"
TOKEN_ADMIN=$(curl -s -c admin.txt -b admin.txt "$BASE/perfil" | grep -o 'name="_csrf" value="[^"]*"' | head -n 1 | cut -d '"' -f 4)
curl -i -b admin.txt -d "_csrf=$TOKEN_ADMIN" -d "codigo=PORT-002" -d "nombre=Portatil HP" -d "tipo=portatil" "$BASE/admin/equipos"   # 303
curl -i -b admin.txt -d "_csrf=$TOKEN_ADMIN" -d "estado=operativo" "$BASE/admin/equipos/3/estado"   # 303
curl -i -b admin.txt -d "estado=fuera_de_servicio" "$BASE/admin/equipos/3/estado"                  # 403 sin token
curl -i -b admin.txt "$BASE/admin/reservas"                                                       # 200
curl -i -b admin.txt -d "_csrf=$TOKEN_ADMIN" "$BASE/admin/reservas/2/cancelar"                    # 303
 
# Límite de intentos de login (a partir del 11.º: 429)
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " -d "email=x@example.com" -d "password=mala" "$BASE/login"; done
```
 
Todas estas operaciones se pueden hacer también desde la interfaz web.
 
---
 
## 6. Uso de inteligencia artificial
 
Historial de la conversación con la IA utilizada como apoyo:
 
https://claude.ai/share/c97f0979-f758-4aa4-bbe2-a761bc87cf5e
