import pkg from "mongoose";
const { connect } = pkg;
const userMongoDB = "psydeveloper"
const passwordMongoDB = "aaron5209"
const databaseMongoDB = "myFirstDatabase"

const im = () => {
	connect(`mongodb+srv://${userMongoDB}:${passwordMongoDB}@cluster0.w4fuw.mongodb.net/${databaseMongoDB}?retryWrites=true&w=majority`, {
		serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log("Banco de dados foi conectado com sucesso!")
  }).catch(e => {
    console.error("Ocorreu um erro ao tentar conectar ao banco de dados.")
		console.log(e)
  })
};

export default im;