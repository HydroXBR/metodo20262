import pkg from "mongoose"
const {Schema, model} = pkg

const calculadoraSchema = Schema({
    // Identificação do curso
    universidade: { type: String, required: true },
    curso: { type: String, required: true },
    campus: { type: String },
    
    // Informações sobre o vestibular
    vestibular: { 
        type: String, 
        enum: ['PSC', 'SIS', 'ENEM', 'PSI', 'MACRO'], 
        required: true 
    },
    ano: { type: Number, required: true },
    edicao: { type: String }, // Ex: "PSC 2026", "SIS 1 2025"
    
    // Sistema de cotas
    cota: {
        tipo: { 
            type: String, 
            enum: ['AMPLA', 'PPI', 'RENDA', 'PUBLICA', 'DEFICIENTE', 'OUTRA'],
            default: 'AMPLA'
        },
        descricao: { type: String }
    },
    
    // Notas de corte
    notas: {
        // Notas separadas por prova (para cálculo detalhado)
        psc1: { type: Number, min: 0, max: 54 },
        psc2: { type: Number, min: 0, max: 54 },
        psc3: { type: Number, min: 0, max: 54 },
        redacao: { type: Number, min: 0, max: 9 },
        
        // SIS (60 questões cada + redação 0-10)
        sis1: { type: Number, min: 0, max: 60 },
        sis2: { type: Number, min: 0, max: 60 },
        sis3: { type: Number, min: 0, max: 60 },
        redacaoSis2: { type: Number, min: 0, max: 10 },
        redacaoSis3: { type: Number, min: 0, max: 10 },
        
        // ENEM com pesos
        linguagens: { type: Number, min: 0, max: 1000 },
        humanas: { type: Number, min: 0, max: 1000 },
        natureza: { type: Number, min: 0, max: 1000 },
        matematica: { type: Number, min: 0, max: 1000 },
        redacaoEnem: { type: Number, min: 0, max: 1000 },
        
        // Pesos ENEM (se aplicável)
        pesos: {
            linguagens: { type: Number, default: 1 },
            humanas: { type: Number, default: 1 },
            natureza: { type: Number, default: 1 },
            matematica: { type: Number, default: 1 },
            redacao: { type: Number, default: 1 }
        },
        
        // Nota total (já calculada com pesos)
        total: { type: Number, required: true },
        
        // Informações adicionais
        colocacao: { type: Number }, // Posição do último classificado
        vagas: { type: Number }, // Número de vagas
        periodo: { type: String } // Matutino, Vespertino, Noturno, Integral
    },
    
    // Metadados
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: Date.now }
});

// Índices para busca eficiente
calculadoraSchema.index({ vestibular: 1, ano: 1, cota: 1 });
calculadoraSchema.index({ universidade: 1, curso: 1 });
calculadoraSchema.index({ 'notas.total': 1 });

const Calculadora = model('Calculadora', calculadoraSchema);

export { Calculadora };