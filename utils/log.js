// FONCTIONS DE LOGS
exports.log = log;
exports.logError = logError;
exports.logColor = logColor;


/*
 * 0.default
 * 1.black
 * 2.red
 * 3.green
 * 4.yellow
 * 5.blue
 * 6.magenta
 * 7.cyan
 */
const fontColors = [
  "\x1b[0m", "\x1b[30m", "\x1b[31m",
  "\x1b[32m", "\x1b[33m", "\x1b[34m",
  "\x1b[35m", "\x1b[36m"
];


/**
 * @desc Log une suite d'arguments.
 */
function log() {
  var mess = Array.from(arguments);
  console.log(mess.join(""));
}


/**
 * @desc Log un message colore avec un niveau de profondeur.
 *
 * @param {int} lvl - Niveau du message.
 * @param {int} color - Numero de la couleur du message.
 */
function logColor(lvl, color) {
  var message = startingMessage(lvl);
  message += fontColors[color];
  var mess = Array.from(arguments);
  var messConcat = "";
  mess.shift();
  mess.shift();
  message = message + mess.join("") + fontColors[0];
  console.log(message);
}


/**
 * @desc Log une erreur si presente, sinon une suite d'arguments.
 *
 * @param {int} lvl - Niveau du message.
 * @param {error} err - Erreur de la requete.
 */
function logError(lvl, err) {
  var message = startingMessage(lvl);
  if (err != null) {
    message = message + fontColors[2] + err + fontColors[0];
    console.log(message);
  } else {
    var mess = Array.from(arguments);
    mess.shift();
    mess.shift();
    message = message + fontColors[3] + mess.join("") + fontColors[0];
    console.log(message);
  }
}


/**
 * @desc Donne la string correspondant au niveau du message :
 * 3 : Debut de requete
 * 2 : Sous requete
 * 1 : Fin de requete
 *
 * @param {int} lvl - Niveau du message.
 * @returns {string} Message de debut.
 */
function startingMessage(lvl) {
  switch (lvl) {
    case 3:
      return "\n--- ";
      break;
    case 2:
      return "-- ";
      break;
    case 1:
      return "- ";
      break;
    default:
      return "- ";
  }
}
