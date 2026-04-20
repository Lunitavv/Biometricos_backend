// backend/server.js
// API REST intermedia — conecta la app Android con MongoDB Atlas
// Ejecutar: node server.js   (requiere Node.js ≥ 18)

require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Conexión a MongoDB Atlas ──────────────────────────────────────
// Las credenciales se leen desde .env, NUNCA van en este archivo.
const client = new MongoClient(process.env.MONGODB_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 5000
});
let db;

async function conectar() {
  await client.connect();
  db = client.db(process.env.DB_NAME || "bitacora");
  console.log("✅ Conectado a MongoDB Atlas");
}

// ── Rutas ─────────────────────────────────────────────────────────

// GET /api/entradas  →  devuelve todas las entradas ordenadas por fecha
app.get("/api/entradas", async (req, res) => {
  try {
    const entradas = await db
      .collection("entradas")
      .find()
      .sort({ fecha: 1, hora: 1 })
      .toArray();
    res.json(entradas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener entradas" });
  }
});

// POST /api/entradas  →  inserta una nueva entrada
app.post("/api/entradas", async (req, res) => {
  try {
    const { titulo, resumen, kilometros, minutos, fecha, hora } = req.body;

    if (!titulo || !resumen || !fecha || !hora) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const nueva = {
      titulo,
      resumen,
      kilometros: Number(kilometros) || 0,
      minutos: Number(minutos) || 0,
      fecha,
      hora,
      creadoEn: new Date()
    };

    const result = await db.collection("entradas").insertOne(nueva);
    res.status(201).json({ _id: result.insertedId, ...nueva });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al insertar entrada" });
  }
});

// GET /api/entradas/:id  →  obtiene una entrada por ID
app.get("/api/entradas/:id", async (req, res) => {
  try {
    const entrada = await db
      .collection("entradas")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!entrada) return res.status(404).json({ error: "No encontrada" });
    res.json(entrada);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener entrada" });
  }
});

// ── Arranque ──────────────────────────────────────────────────────
conectar()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB:", err);
    process.exit(1);
  });
