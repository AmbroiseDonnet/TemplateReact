import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/auth'

const app = express()
const PORT = process.env.PORT || 8081

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,        // reflète l'Origin de la requête
  credentials: true,
}))
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)

// Route de santé (pour vérifier que le serveur tourne)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Connexion MongoDB + démarrage ────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('✅ Connecté à MongoDB')

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err)
    process.exit(1)
  }
}

start()
