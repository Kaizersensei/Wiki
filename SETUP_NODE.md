## Node.js Setup (for Densetsu Wiki dev server)

This project only needs Node.js (npm is bundled). Follow the steps for your OS, then verify the installation.

### Windows
1) Download the LTS installer (64‑bit) from https://nodejs.org  
2) Run the installer; keep “Add to PATH” enabled; finish.  
3) Verify in PowerShell:
```
node -v
npm -v
```

### macOS
1) Download the macOS (pkg) LTS installer from https://nodejs.org  
2) Run the pkg; accept defaults.  
3) Verify in Terminal:
```
node -v
npm -v
```

### Linux (Debian/Ubuntu)
```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

After install, start the local save server from the repo root:
```
node scripts/dev-save-server.js
```
It serves pages at http://localhost:3000 and listens for saves at http://localhost:3000/__save.

