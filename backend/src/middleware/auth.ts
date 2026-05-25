import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Étendre le type Request d'Express pour y ajouter userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié — token manquant' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    req.userId = payload.userId
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Session expirée, reconnecte-toi' })
    } else {
      res.status(401).json({ error: 'Token invalide' })
    }
  }
}
