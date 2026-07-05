import mongoose from 'mongoose'

const contextRuleSchema = new mongoose.Schema({
  context: {
    type: String,
    required: true,
    enum: ['health', 'eco', 'productivity', 'finance']
  },
  objectLabel: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  defaultVerdict: {
    type: String,
    enum: ['Good', 'Bad', 'Neutral'],
    required: true
  },
  notes: String
}, { timestamps: true })

contextRuleSchema.index({ context: 1, objectLabel: 1 }, { unique: true })

export default mongoose.model('ContextRule', contextRuleSchema)
