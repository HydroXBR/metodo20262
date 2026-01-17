import pkg from "mongoose"
const { Schema, model } = pkg

const simuladosSchema = Schema({
	id: String,
	answers: String
});

const redacaoSchema = Schema({
	titulo: { type: String, required: true },
	estilo: {
		type: String,
		enum: ['enem', 'psc', 'sis', 'macro', 'outro'],
		required: true
	},
	texto: { type: String, required: true },
	observacoes: String,
	dataEnvio: { type: Date, default: Date.now },
	dataCorrecao: Date,
	status: {
		type: String,
		enum: ['pendente', 'corrigido', 'arquivado'],
		default: 'pendente'
	},
	nota: Number,
	competencias: [{
		nome: String,
		nota: Number,
		maxNota: Number,
		comentarios: String
	}],
	comentariosProfessor: String,
	professorCorretor: String,
	feedbacks: [{
		tipo: String,
		comentario: String,
		sugestao: String
	}]
});

const qSchema = Schema({
	questionId: {
		type: Schema.Types.ObjectId,
		ref: 'Question'  // Referência à questão
	},
	answer: {  // Mudar para String para armazenar 'A', 'B', 'C', etc.
		type: String,
		enum: ['A', 'B', 'C', 'D', 'E']
	},
	correct: Boolean,
	date: { type: Date, default: Date.now }
});

const cSchema = Schema({
	classId: String,
	course: String,
	date: { type: Date, default: Date.now }
});

const schema = Schema({
	completename: { type: String, required: true },
	turma: { type: Number, required: true },
	cursos: { type: [String], default: [] },
	questoes: [qSchema],
	aulas: [cSchema],
	cpf: { type: String, required: true },
	email: { type: String, required: true },
	senha: { type: String, required: true },
	profilePicture: { type: String, default: "" },
	permissions: { type: Number, default: 0 },
	simulados: [simuladosSchema],
	redacoes: [redacaoSchema],
	registered: { type: Number, default: new Date().getTime() },
})

const user = model('metodousers', schema)
export default user