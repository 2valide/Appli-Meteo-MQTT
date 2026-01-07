# Appli-Meteo-MQTT

Application météo en temps réel utilisant MQTT → Bridge Node.js (WebSocket) → Front Svelte.

## 📋 Description

Ce projet consiste en un bridge Node.js qui :
- Se connecte à un broker MQTT distant
- Reçoit les données météo des capteurs (topic: `classroom/+/telemetry`)
- Relay ces données en temps réel via WebSocket vers les clients connectés

## 🔧 Prérequis

- **Node.js** version 14 ou supérieure
- **npm** (inclus avec Node.js)

### Vérifier l'installation

**macOS / Linux :**
```bash
node --version
npm --version
```

**Windows (PowerShell ou CMD) :**
```cmd
node --version
npm --version
```

### Installation de Node.js

Si Node.js n'est pas installé :

- **macOS** : Télécharger depuis [nodejs.org](https://nodejs.org/) ou utiliser Homebrew :
  ```bash
  brew install node
  ```

- **Linux (Ubuntu/Debian) :**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **Windows** : Télécharger l'installateur depuis [nodejs.org](https://nodejs.org/)

## 🚀 Installation

1. **Cloner ou télécharger le projet**

2. **Installer les dépendances**

   **macOS / Linux :**
   ```bash
   cd bridge
   npm install
   ```

   **Windows (PowerShell ou CMD) :**
   ```cmd
   cd bridge
   npm install
   ```

## ▶️ Lancement du serveur

**macOS / Linux :**
```bash
cd bridge
npm start
```

**Windows (PowerShell ou CMD) :**
```cmd
cd bridge
npm start
```

**Alternative :** Vous pouvez aussi utiliser directement `node server.js`

Vous devriez voir :
```
Server listening on http://localhost:8080
Connected to MQTT broker
Subscribed to topic: classroom/+/telemetry
```

## 🧪 Tester la connexion WebSocket

### Option 1 : wscat (recommandé)

Installer wscat globalement :
```bash
npm install -g wscat
```

Puis tester :
```bash
wscat -c ws://localhost:8080
```

### Option 2 : Navigateur

Ouvrir la console du navigateur et exécuter :
```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  console.log('Message reçu:', JSON.parse(event.data));
};
```

## 📡 Configuration MQTT

Le serveur est configuré pour se connecter à :
- **Broker** : `mqtt://captain.dev0.pandor.cloud:1884`
- **Topic** : `classroom/+/telemetry` (wildcard pour tous les devices)

### Publier des données de test

Avec **MQTT Explorer** ou un client MQTT :
- **Broker** : `captain.dev0.pandor.cloud`
- **Port** : `1884`
- **Topic** : `classroom/test-device/telemetry`
- **Message** :
  ```json
  {
    "temperature": 22.5,
    "humidity": 65,
    "pressure": 1013.25
  }
  ```

## 📦 Structure du projet

```
Appli-Meteo-MQTT/
├── bridge/              # Serveur Node.js (MQTT → WebSocket)
│   ├── server.js        # Code principal du bridge
│   └── package.json     # Dépendances
├── front/               # Front Svelte (à venir)
└── contracts/           # Contrats de données (à venir)
```

## 🔍 Format des messages

Les messages relayés aux clients WebSocket ont le format suivant :

```json
{
  "topic": "classroom/device-id/telemetry",
  "payload": {
    "temperature": 22.5,
    "humidity": 65,
    "pressure": 1013.25
  },
  "receivedAt": 1699123456789
}
```

## 🛠️ Dépannage

### Le serveur ne démarre pas

- Vérifier que Node.js est installé : `node --version`
- Vérifier que les dépendances sont installées : `cd bridge && npm install`

### Erreur de connexion MQTT

- Le broker peut être temporairement inaccessible (normal selon le ticket IA-06)
- Le serveur continue de fonctionner même si la connexion MQTT échoue

### Port déjà utilisé

- Changer le port dans `bridge/server.js` (ligne `const PORT = 8080`)

## 📝 Développement

### Ajouter une dépendance

```bash
cd bridge
npm install <nom-du-package>
```

### Lancer en mode développement

Le serveur redémarre automatiquement si vous utilisez un outil comme `nodemon` :

```bash
npm install -g nodemon
nodemon bridge/server.js
```

## 📄 Licence

ISC

