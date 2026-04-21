// ──────────────────────────────────────────────────────────────
//  blockchain.js — Motor de blockchain de IGCoin
// ──────────────────────────────────────────────────────────────
//  Este archivo contiene la lógica central de la blockchain:
//  - Cómo se calcula un hash
//  - Cómo se crea un bloque
//  - Cómo se arma la cadena
//  - Cómo se valida la cadena
//
//  El Equipo C debe leer, entender y poder explicar cada una
//  de estas funciones. Son la base de toda la cripto.
// ──────────────────────────────────────────────────────────────

const crypto = require('crypto');

// ── Función que calcula el hash de un bloque ─────────────────
//  Un hash es como la "huella digital" del bloque:
//  si cambia una sola letra del bloque, el hash cambia completamente.
//  Usamos SHA-256, el mismo algoritmo que usa Bitcoin.
// ──────────────────────────────────────────────────────────────
function calcularHash(bloque) {
  const datos = bloque.index +
                bloque.timestamp +
                JSON.stringify(bloque.transactions) +
                bloque.previousHash;
  return crypto.createHash('sha256').update(datos).digest('hex');
}

// ── Clase Blockchain ─────────────────────────────────────────
//  Representa la cadena completa de bloques.
//  Tiene métodos para agregar transacciones, minar bloques
//  y validar que la cadena no haya sido alterada.
// ──────────────────────────────────────────────────────────────
class Blockchain {
  constructor() {
    this.chain = [];                    // la cadena de bloques
    this.transaccionesPendientes = [];  // transacciones que esperan ser minadas
    this.crearBloqueGenesis();          // bloque inicial
  }

  // El primer bloque de la cadena no tiene bloque anterior,
  // así que le ponemos un hash previo "0" por convención.
  crearBloqueGenesis() {
    const bloqueGenesis = {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [],
      previousHash: '0',
      hash: ''
    };
    bloqueGenesis.hash = calcularHash(bloqueGenesis);
    this.chain.push(bloqueGenesis);
  }

  // Devuelve el último bloque de la cadena.
  obtenerUltimoBloque() {
    return this.chain[this.chain.length - 1];
  }

  // Agrega una transacción a la lista de pendientes.
  // Las pendientes se incorporan a un bloque cuando se "mina".
  agregarTransaccion(sender, recipient, amount) {
    // Validación básica: no se puede enviar un monto negativo o cero
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }
    this.transaccionesPendientes.push({
      sender,
      recipient,
      amount,
      timestamp: new Date().toISOString()
    });
    // Devolvemos el índice del próximo bloque donde estará la transacción
    return this.obtenerUltimoBloque().index + 1;
  }

  // Mina un nuevo bloque con las transacciones pendientes.
  // "Minar" acá es más simple que en Bitcoin: solo agrupamos
  // las transacciones en un bloque y calculamos su hash.
  minarBloque() {
    if (this.transaccionesPendientes.length === 0) {
      return null; // no hay nada para minar
    }

    const ultimoBloque = this.obtenerUltimoBloque();
    const nuevoBloque = {
      index: ultimoBloque.index + 1,
      timestamp: new Date().toISOString(),
      transactions: this.transaccionesPendientes,
      previousHash: ultimoBloque.hash,
      hash: ''
    };
    nuevoBloque.hash = calcularHash(nuevoBloque);

    this.chain.push(nuevoBloque);
    this.transaccionesPendientes = []; // limpiamos las pendientes

    return nuevoBloque;
  }

  // Valida que la cadena no haya sido alterada.
  // Recorre todos los bloques y verifica que:
  //  1. El hash del bloque coincida con el recalculado
  //  2. El previousHash apunte al hash real del bloque anterior
  esValida() {
    for (let i = 1; i < this.chain.length; i++) {
      const actual = this.chain[i];
      const anterior = this.chain[i - 1];

      // ¿El hash del bloque es realmente el hash de sus datos?
      const hashRecalculado = calcularHash(actual);
      if (actual.hash !== hashRecalculado) {
        return { valid: false, razon: `Bloque ${actual.index} fue alterado` };
      }

      // ¿El previousHash apunta correctamente al anterior?
      if (actual.previousHash !== anterior.hash) {
        return { valid: false, razon: `Bloque ${actual.index} no apunta al bloque anterior` };
      }
    }
    return { valid: true, razon: 'Cadena íntegra' };
  }

  // Calcula el saldo de una wallet recorriendo toda la cadena.
  // Suma lo recibido y resta lo enviado.
  calcularSaldo(walletId) {
    let saldo = 0;
    for (const bloque of this.chain) {
      for (const tx of bloque.transactions) {
        if (tx.recipient === walletId) saldo += tx.amount;
        if (tx.sender === walletId)    saldo -= tx.amount;
      }
    }
    return saldo;
  }

  // Devuelve todas las transacciones donde aparece una wallet.
  obtenerHistorial(walletId) {
    const historial = [];
    for (const bloque of this.chain) {
      for (const tx of bloque.transactions) {
        if (tx.sender === walletId || tx.recipient === walletId) {
          historial.push({ ...tx, bloque: bloque.index });
        }
      }
    }
    return historial;
  }

  // Calcula el ranking de wallets por saldo recibido.
  // Útil para el módulo del Equipo B.
  obtenerRanking() {
    const saldos = {};
    for (const bloque of this.chain) {
      for (const tx of bloque.transactions) {
        if (tx.sender === 'GENESIS') continue; // ignoramos las cargas iniciales
        saldos[tx.recipient] = (saldos[tx.recipient] || 0) + tx.amount;
      }
    }
    return Object.entries(saldos)
      .map(([wallet, total]) => ({ wallet, total }))
      .sort((a, b) => b.total - a.total);
  }
}

module.exports = { Blockchain, calcularHash };
