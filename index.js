// IGCoin - Backend principal
// Punto de entrada para Render

const express = require('express');
const fs = require('fs');
const path = require('path');
const { Blockchain } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 3000;
const LEDGER_FILE = path.join(__dirname, 'blockchain.json');

app.use(express.json());

// CORS para que los frontends de los Equipos A y B puedan conectarse
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Servir el panel de visualizacion
app.use(express.static(path.join(__dirname, 'public')));

const igcoin = new Blockchain();

// Cargar cadena previa si existe
if (fs.existsSync(LEDGER_FILE)) {
  try {
    const datos = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
    igcoin.chain = datos.chain;
    igcoin.transaccionesPendientes = datos.transaccionesPendientes || [];
    console.log('Cadena cargada: ' + igcoin.chain.length + ' bloques');
  } catch (e) {
    console.log('No se pudo cargar el archivo, iniciando cadena nueva');
  }
} else {
  console.log('Iniciando con cadena nueva');
}

function guardarLedger() {
  try {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify({
      chain: igcoin.chain,
      transaccionesPendientes: igcoin.transaccionesPendientes
    }, null, 2));
  } catch (e) {
    console.log('No se pudo guardar el ledger:', e.message);
  }
}

// ENDPOINTS

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bloques: igcoin.chain.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/chain', (req, res) => {
  res.json({ chain: igcoin.chain, length: igcoin.chain.length });
});

app.get('/chain/valid', (req, res) => {
  res.json(igcoin.esValida());
});

app.post('/transactions/new', (req, res) => {
  const { sender, recipient, amount } = req.body;

  if (!sender || !recipient || amount === undefined) {
    return res.status(400).json({ error: 'Faltan datos: sender, recipient, amount' });
  }

  if (sender !== 'GENESIS') {
    const saldo = igcoin.calcularSaldo(sender);
    if (saldo < amount) {
      return res.status(400).json({
        error: 'Saldo insuficiente. Tenes ' + saldo + ' IGCoins, queres enviar ' + amount
      });
    }
  }

  try {
    const indiceBloque = igcoin.agregarTransaccion(sender, recipient, amount);
    igcoin.minarBloque();
    guardarLedger();
    res.json({
      message: 'Transaccion registrada en el bloque ' + indiceBloque,
      transaction: { sender, recipient, amount }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/mine', (req, res) => {
  const nuevoBloque = igcoin.minarBloque();
  if (!nuevoBloque) {
    return res.json({ message: 'No hay transacciones pendientes para minar' });
  }
  guardarLedger();
  res.json({ message: 'Bloque minado', bloque: nuevoBloque });
});

app.get('/wallet/:id/saldo', (req, res) => {
  const walletId = req.params.id;
  res.json({ wallet: walletId, saldo: igcoin.calcularSaldo(walletId) });
});

app.get('/wallet/:id/historial', (req, res) => {
  const walletId = req.params.id;
  res.json({ wallet: walletId, historial: igcoin.obtenerHistorial(walletId) });
});

app.get('/ranking', (req, res) => {
  res.json({ ranking: igcoin.obtenerRanking() });
});

app.post('/wallet/crear', (req, res) => {
  const { walletId, saldoInicial = 100 } = req.body;
  if (!walletId) {
    return res.status(400).json({ error: 'Se requiere walletId' });
  }
  try {
    igcoin.agregarTransaccion('GENESIS', walletId, saldoInicial);
    igcoin.minarBloque();
    guardarLedger();
    res.json({
      message: 'Wallet ' + walletId + ' creada con ' + saldoInicial + ' IGCoins',
      walletId, saldoInicial
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/demo/alterar-bloque', (req, res) => {
  const { indice, nuevoMonto } = req.body;
  if (!igcoin.chain[indice] || !igcoin.chain[indice].transactions[0]) {
    return res.status(400).json({ error: 'Bloque o transaccion no encontrados' });
  }
  const valorAnterior = igcoin.chain[indice].transactions[0].amount;
  igcoin.chain[indice].transactions[0].amount = nuevoMonto;
  res.json({
    message: 'Bloque alterado manualmente',
    bloque: indice,
    valorAnterior,
    valorNuevo: nuevoMonto
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('IGCoin Backend corriendo en puerto ' + PORT);
});
