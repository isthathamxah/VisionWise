import mongoose from 'mongoose'

const scanLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  objectLabel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  context: {
    type: String,
    required: true,
    enum: ['health', 'eco', 'productivity', 'finance']
  },
  verdict: {
    type: String,
    required: true,
    enum: ['Good', 'Bad', 'Neutral']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reason: {
    type: String,
    required: true
  },
  tips: {
    type: [String],
    default: []
  },
  breakdown: {
    type: [{ label: String, percent: Number, _id: false }],
    default: []
  },
  food: {
    type: {
      isFood: Boolean,
      dishType: String,
      source: String,
      servingNote: String,
      unclear: Boolean,
      nutrients: [{ label: String, amount: Number, unit: String, percentDV: Number, impact: String, note: String, _id: false }],
      ingredients: [{ name: String, whatItIs: String, whyUsed: String, effect: String, concern: String, _id: false }]
    },
    default: undefined
  }
}, { timestamps: true })

scanLogSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('ScanLog', scanLogSchema)
