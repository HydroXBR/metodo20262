// calculadoraModel.js - Modelo atualizado com sistema de cotas completo
import pkg from "mongoose"
const {Schema, model} = pkg

// Definição de tipos de cota por vestibular
const TIPOS_COTA = {
    // PSC/PSI
    PSC: [
        'AMPLA', 'PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 
        'NDC1', 'NDC2', 'PCD1', 'PCD2', 'BONIFICA'
    ],
    
    // ENEM/SISU
    ENEM: [
        'AMPLA', 'L1', 'L2', 'L5', 'L6', 'L9', 'L10', 'L13', 'L14'
    ],
    
    // SIS UEA
    SIS: [
        'AMPLA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'
    ],
    
    // MACRO UEA
    MACRO: [
        'AMPLA', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'
    ],
    
    // PSI UFAM
    PSI: [
        'AMPLA', 'PP1', 'PP2', 'IND1', 'IND2', 'QLB1', 'QLB2', 
        'NDC1', 'NDC2', 'PCD1', 'PCD2', 'INTERIOR'
    ]
};

const calculadoraSchema = Schema({
    // Identificação básica
    universidade: { type: String, required: true },
    curso: { type: String, required: true },
    campus: { type: String },
    
    // Vestibular e ano
    vestibular: { 
        type: String, 
        enum: ['PSC', 'SIS', 'ENEM', 'PSI', 'MACRO'], 
        required: true 
    },
    ano: { type: Number, required: true },
    edicao: { type: String },
    
    // Sistema de cotas - estrutura complexa
    cotas: [{
        tipo: { 
            type: String,
            required: true
        },
        codigo: { type: String }, // Código específico (L1, A, G1, etc)
        descricao: { type: String, required: true },
        notaCorte: { type: Number, required: true },
        vagas: { type: Number },
        colocacao: { type: Number },
        percentualBonus: { type: Number, default: 0 }, // Para bônus como PSI interior
        
        // Metadados
        preenchida: { type: Boolean, default: false },
        observacoes: { type: String }
    }],
    
    // Nota geral (ampla concorrência) - mantida para compatibilidade
    notaGeral: { type: Number },
    
    // Informações do curso
    periodo: { type: String }, // Matutino, Vespertino, Noturno, Integral
    turno: { type: String },
    duracao: { type: Number }, // Em semestres
    modalidade: { type: String }, // Presencial, EAD
    
    // Totais
    totalVagas: { type: Number },
    vagasAmpla: { type: Number },
    
    // Metadados
    ativo: { type: Boolean, default: true },
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: Date.now }
});

// Middleware para validação de cotas
calculadoraSchema.pre('save', function(next) {
    if (this.cotas && this.cotas.length > 0) {
        // Garantir que AMPLA seja a primeira
        this.cotas.sort((a, b) => {
            if (a.tipo === 'AMPLA') return -1;
            if (b.tipo === 'AMPLA') return 1;
            return 0;
        });
        
        // Validar tipos de cota conforme vestibular
        const tiposPermitidos = TIPOS_COTA[this.vestibular] || [];
        this.cotas = this.cotas.filter(cota => 
            tiposPermitidos.includes(cota.tipo) || 
            tiposPermitidos.includes(cota.codigo)
        );
    }
    next();
});

// Método para obter descrição da cota
calculadoraSchema.methods.getDescricaoCota = function(tipoCota) {
    const cota = this.cotas.find(c => c.tipo === tipoCota || c.codigo === tipoCota);
    return cota ? cota.descricao : tipoCota;
};

// Método para obter nota de corte por cota
calculadoraSchema.methods.getNotaCorte = function(tipoCota) {
    const cota = this.cotas.find(c => c.tipo === tipoCota || c.codigo === tipoCota);
    return cota ? cota.notaCorte : this.notaGeral;
};

const Calculadora = model('Calculadora', calculadoraSchema);

export { Calculadora, TIPOS_COTA };