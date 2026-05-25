import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser extends Document {
    username: string
    email: string
    password: string
    createdAt: Date
    comparePassword(candidate: string): Promise<boolean>
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [8, 'Le mot de passe doit faire au moins 8 caractères'],
  },
  username: {
    type: String,
    required: [true, 'Nom d\'utilisateur requis'],
    trim: true,
    unique: true,
    minlength: [3, 'Le nom d\'utilisateur doit faire au moins 3 caractères'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Hash le mot de passe avant chaque sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

// Ne jamais renvoyer le mot de passe dans les réponses JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).password
    return ret
  },
})

export default mongoose.model<IUser>('User', userSchema)
