# Restoration Admin Dashboard

Back-office React pour le projet Firebase de `restauration`, compatible sans Blaze.

## Modes d'action admin

- `local-api`
  Le front appelle le backend local Node.js sur `127.0.0.1`.
- `manual`
  Le front affiche des commandes Admin SDK a copier.
- `functions`
  Le front appelle les Cloud Functions si elles existent.

## Variables React

Copier `.env.example` vers `.env` puis configurer :

```bash
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_ADMIN_ACTION_MODE=local-api
REACT_APP_LOCAL_ADMIN_API_URL=http://127.0.0.1:5055
REACT_APP_LOCAL_ADMIN_TOKEN=change_me_local_only
REACT_APP_ENABLE_ADMIN_FUNCTIONS=false
```

## Lancer le backend local

```bash
cd "C:\Users\chame\restoration\restauration\backend\admin-sdk"
npm install
npm run local-api
```

## Lancer React

```bash
cd "C:\Users\chame\restoration\admin resto\fullstack-admin-master\client"
npm install
npm start
```

Build production :

```bash
npm run build
```

## Securite

- Firebase Auth + Custom Claims restent la source de verite pour `approved`, `admin`, `kitchen`
- React ne modifie jamais les claims
- le backend local ne doit jamais etre expose sur Internet
- `serviceAccountKey.json` reste uniquement cote backend local

## Limitations du mode gratuit

- la page reservations admin reste essentiellement en lecture seule hors mode `functions`
- les actions critiques users/recharges passent par `local-api` ou `manual`
- pas de dependance obligatoire a Blaze
