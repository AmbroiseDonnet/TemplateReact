import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

const router = Router()

// ─── Inscription ──────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body

    // Validation basique
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Tous les champs sont requis' })
    }

    // Vérifier si l'email est déjà utilisé
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' })
    }

    // Créer l'utilisateur (le mot de passe sera hashé automatiquement via le hook pre-save)
    const user = await User.create({ email, password, username })

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    )

    res.status(201).json({
        success: true,
        message: 'Compte créé avec succès',
        token,
        user: {
            id: user._id,
            email: user.email,
            username: user.username,
        },
    })
  } catch (err: any) {
    // Erreur de validation Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    console.error('Erreur register:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Connexion ────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
    console.log('body reçu:', req.body)
    try {
        const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis' })
    }

    // Trouver l'utilisateur (on resélectionne le password car il est exclu par défaut)
    const user = await User.findOne({ username }).select('+password')
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    // Vérifier le mot de passe
    const isValid = await user.comparePassword(password)
    if (!isValid) {
        return res.status(401).json({ error: 'Identifiants invalides' })
    }

    // Générer le token JWT
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    )

    res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
            id: user._id,
            email: user.email,
            username: user.username,
        },
    })
  } catch (err) {
    console.error('Erreur login:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── Vérifier le token (utile pour le frontend au démarrage) ──────────────────
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Non authentifié' })

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    const user = await User.findById(payload.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    res.json({ user: { id: user._id, email: user.email, username: user.username } })
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
})

export default router
