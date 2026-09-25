import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Permite objetos grandes como el historial

// Inicializa el archivo JSON si no existe
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}), 'utf8');
}

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// GET: Obtener un estado específico de Zustand (por su "key")
app.get('/api/store/:key', (req, res) => {
  const db = readDB();
  const value = db[req.params.key] || null;
  res.json(value);
});

// POST: Guardar o actualizar un estado de Zustand
app.post('/api/store/:key', (req, res) => {
  const db = readDB();
  db[req.params.key] = req.body;
  writeDB(db);
  res.json({ success: true });
});

// DELETE: Borrar un estado
app.delete('/api/store/:key', (req, res) => {
  const db = readDB();
  delete db[req.params.key];
  writeDB(db);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ [Base de Datos Local] Servidor JSON corriendo en http://localhost:${PORT}`);
  console.log(`📁 [Archivo] Los datos se están guardando en: ${DB_FILE}`);
});
