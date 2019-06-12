
const Sequelize = require('sequelize')
const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');


/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};




/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
    /*
    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]:  ${quiz.question}`);
    });
    rl.prompt();
    */

	models.quiz.findAll()
		.then(quizzes => { 
			quizzes.forEach((quizzes) => {log(` [${colorize(quizzes.id, 'magenta')}]:  ${quizzes.question}`);
			})
		})
		.catch( error =>{
			errorlog(error.message);
		})
		.then(() => {
			rl.prompt();
		})
	};



const validaId = id => {
	return new Sequelize.Promise ( (resolve, reject) => {
		if ( typeof id === "undefined") { reject (new Error (`Falta el paràmetro <id>`))} 
			else {
				id = parseInt(id);
				if (Number.isNaN(id)) {
					reject (new Error (`El valor del paràmetro <id> no es un numero`))
				} else {resolve(id)}
			}		
		}

	)
	};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
	validaId(id)
	.then( id => models.quiz.findByPk(id))
	.then( quiz => { if (!quiz) { throw new (`No existe el quiz asociado al id <id>`);}

	log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question} ${colorize('=>','magenta')}  ${quiz.answer} `);
	})
	.catch(error => {
		errorlog(error.message) ;
	})
	.then(()=>{rl.prompt()
	});
};

/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */

const HacerPregunta = (rl, text) => {
	return new Sequelize.Promise ( (resolve, reject) => {
		rl.question(colorize(text,'red'), answer => {resolve(answer.trim());
		});
	});
};

exports.addCmd = rl => {

/*
    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
*/

	HacerPregunta(rl,'Introduzca una pregunta')
	.then(a => {
		return HacerPregunta(rl,'Introduzca la respuesta')
		.then(b => {
		return {question: a, answer: b};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz =>{
		 log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo')
	})
	.catch(error => {
		errorlog(error.message)
	})
	.then( () => {
		rl.prompt();
	});
};





/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
/*
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
*/

	validaId(id)
	.then( id => models.quiz.findByPk(id))
	.then( quiz => { if (!quiz) { throw new (`No existe el quiz asociado al id <id>`);}
		models.quiz.destroy({where: {id}});
	})
	.catch(error => {
		errorlog(error.message)
	})
	.then( () => {
		rl.prompt();
	});


};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {

	validaId(id)
	.then( id => models.quiz.findByPk(id))
	.then(quiz =>{
		if (!quiz){
			throw new (`No existe el quiz asociado al id <id>`);
		}  
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return	HacerPregunta(rl,'Edite pregunta')
		.then(a => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return HacerPregunta(rl,'Introduzca la respuesta')
			.then(b => {
				quiz.question = a;
				quiz.answer = b ;
				return quiz;
			});
		})

	})
	.then(quiz => { return quiz.save()  ;
	})	
	.then(quiz =>{
		log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo')
		error.errors.forEach(({message}) => errorlog(message)) ;
	})
	.catch(error => {
		errorlog(error.message)
	})
	.then( () => {
		rl.prompt();
	});

};




/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    log('Probar el quiz indicado.', 'red');
/*
  if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]:  ${quiz.question} `);
            rl.question(colorize(' Introduzca su respuesta: ', 'red'), answer => {
            
            if ( answer == quiz.answer ) { 
                log("Su respuesta es correcta")
                biglog("CORRECTO",'blue')
            } else {
                log("Su respuesta es incorrecta")
                biglog("INCORRECTO",'red')
            }
                 rl.prompt();
            });    
        } catch(error) {
            errorlog(error.message);
            rl.prompt();
        }
    }

*/



};


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
    log('Jugar.', 'red');
    rl.prompt();
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Anama Monzon', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};

