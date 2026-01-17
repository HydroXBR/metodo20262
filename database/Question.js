// models/Question.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const alternativeSchema = new Schema({
  letter: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isImage: {
    type: Boolean,
    default: false
  },
  imageUrl: String
});

const questionSchema = new Schema({
  // Informações básicas
  statement: {
    type: String,
    required: true
  },
  statementImage: String,
  
  // Origem e ano
  origin: {
    type: String,
    enum: ['ENEM', 'PSC', 'SIS', 'FUVEST', 'UNICAMP', 'OUTRA'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  
  // Alternativas
  alternatives: [alternativeSchema],
  correctAlternative: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: true
  },
  
  // Classificação
  subject: {
    type: String,
    enum: ['MATEMATICA', 'PORTUGUES', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'HISTORIA', 'GEOGRAFIA', 'FILOSOFIA', 'SOCIOLOGIA', 'INGLES', 'ESPANHOL', 'OUTRA'],
    required: true
  },
  hashtags: [String],
  difficulty: {
    type: String,
    enum: ['FACIL', 'MEDIA', 'DIFICIL'],
    default: 'MEDIA'
  },
  
  // Explicação
  explanation: String,
  explanationImage: String,
  
  // Estatísticas
  stats: {
    timesAttempted: {
      type: Number,
      default: 0
    },
    timesCorrect: {
      type: Number,
      default: 0
    },
    timesWrong: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'metodousers',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar estatísticas
questionSchema.methods.updateStats = function(isCorrect) {
  this.stats.timesAttempted += 1;
  
  if (isCorrect) {
    this.stats.timesCorrect += 1;
  } else {
    this.stats.timesWrong += 1;
  }
  
  if (this.stats.timesAttempted > 0) {
    this.stats.successRate = (this.stats.timesCorrect / this.stats.timesAttempted) * 100;
  }
  
  this.updatedAt = Date.now();
  return this.save();
};

// Indexes para busca eficiente
questionSchema.index({ subject: 1 });
questionSchema.index({ origin: 1 });
questionSchema.index({ year: 1 });
questionSchema.index({ hashtags: 1 });
questionSchema.index({ difficulty: 1 });

const Question = model('Question', questionSchema);
export default Question;