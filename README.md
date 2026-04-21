# IGCoin

Blockchain educativa para ISC Tech Expo 2026 — Instituto González Catán.

## Deploy en Render

1. Subir este repo a GitHub
2. En Render: New + → Web Service → conectar el repo
3. Configuración:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** dejar vacío
   - **Instance Type:** Free
4. Click en Create Web Service

Render detecta automáticamente que es Node.js por el `package.json` en la raíz.

## Endpoints

- `GET /health` — estado del servicio
- `GET /chain` — cadena completa
- `GET /chain/valid` — verificar integridad
- `POST /transactions/new` — nueva transacción
- `POST /wallet/crear` — crear wallet
- `GET /wallet/:id/saldo` — saldo de wallet
- `GET /wallet/:id/historial` — historial
- `GET /ranking` — ranking de proyectos
- `POST /demo/alterar-bloque` — solo para demo

## Estructura

```
.
├── package.json
├── index.js
├── blockchain.js
├── .gitignore
└── public/
    └── index.html
```
