
const Sequelize = require('sequelize');

const options = { logging: false, operatorsAliases: false};
const sequelize = new Sequelize("sqlite:quizzes.sqlite", options);

sequelize.define('quiz',{
	question:{
		type: Sequelize.STRING, 
	  	unique: {msg: "Ya existe esta pregunta"},
	   	validate: {notEmpty: {msg:"La pregunta no puede estar vacia"}} 
	 } ,
	 answer:{
	    	type: Sequelize.STRING, 
	     	validate: {notEmpty: {msg:"La respuesta no puede estar vacia"}}
	 }
});

sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then((count) => {
  if (!count) {
    return ( 
      sequelize.models.quiz.bulkCreate([
        { question: "Capital de Italia", answer: "Roma"},
        { question: "Capital de Francia", answer: "París"},
        { question: "Capital de España", answer: "Madrid"},
        { question: "Capital de Portugal", answer: "Lisboa"}
      ])
      .then( c => console.log(`  DB created with ${c.length} elems`))
    )
  } else {
    return console.log(`  DB exists & has ${count} elems`);
  }
})
.catch( err => console.log(`   ${err}`));

module.exports = sequelize ;
