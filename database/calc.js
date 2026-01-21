import pkg from "mongoose"
const {Schema, model} = pkg

const userProgressSchema = Schema({
    courseName: { type: String, required: true },
    lastCorte: { type: Number, default: 0 },
    type: { type: String }, 
    lastAccessed: Date,
    totalTime: { type: Number, default: 0 },
});

const calcs = model('calculadora', userProgressSchema);

export { calcs };