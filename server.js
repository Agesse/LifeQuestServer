"use strict";


// MODULES EXTERNES
var http = require('http');
var Datastore = require('nedb');
var url = require('url');
var queryString = require("querystring");
var express = require("express");
var bodyparser = require("body-parser");
var cors = require("cors");
var eventEmitter = require("events");
var btoa = require("btoa"); // convertit en base 64

// MODULES INTERNES
var utils = require("./utils/log.js");

// VARIABLES
// Simplification des routes avec le module express
var app = express();
app.use(bodyparser.json());
app.use(cors());
app.options('*', cors());

// Authentification
var authent = {
  user: "meliban",
  mdp: "2chatons"
}
var authToken = btoa(authent.user + authent.mdp);


// BDD
// Charge les BDD neDB
var db = {};
db.quests = new Datastore({
  filename: "bdd/quests",
  autoload: true
});


// ROUTES
app.get("/authent", logIn);
app.get("/quests", security, getQuests);
app.post("/quests", security, postQuest);
app.get("/quests/:id", security, getQuest);
app.delete("/quests/:id", security, deleteQuest);
app.put("/quests/:id/objectives", security, checkObjective)




// AUTHENTIFICATION
/**
 * @desc Renvoi un token d'authentification si le login est bon.
 * @param {string} user - Utilisateur.
 * @param {string} mdp - Mot de passe.
 */
function logIn(req, res) {
  utils.logColor(3, 0, "AUTH ..");
  if(req.query.user === authent.user && req.query.mdp === authent.mdp) {
    utils.logColor(1, 3, "AUTH OK");
    res.status(200).send();
  } else {
    utils.logColor(1, 2, "AUTH KO");
    res.status(401).send();
  }
}


/**
 * @desc Check la validite du token d'authorization.
 * @param {any} req - Requete a regarder.
 * @param {any} res - Reponse a envoyer (401 si invalide).
 * @param {any} next - Foncton qui sera appelee si valide.
 */
function security(req, res, next) {
  if(!req.headers.authorization || req.headers.authorization !== authToken) {
    utils.logColor(1, 2, "AUTH KO");
    res.status(401).send();
  } else {
    next();
  }
}




// FONCTIONS
/**
 * @desc GET /quests(?completed=BOOL) : Retourne toutes les quêtes.
 * @param {boolean} (opt) Faux si on veut les quêtes non complétées, vrai sinon.
 * @return {[Quests]} Tableau des quêtes correspondantes.
 */
function getQuests(req, res) {
  utils.logColor(3, 0, "GET .. : All quests");
  // SI query : Récupère les quêtes (non) complétées
  if (Object.keys(req.query).length != 0) {
    var query = req.query.completed === "true" ? true : false;
    db.quests.find({
      completed: query
    }).sort({
      title: 1
    }).exec((err, docs) => {
      utils.logError(1, err, "GET OK : All quests completed = ", query);
      res.json(docs);
    });
  }
  // SINON Récupère toutes les quêtes par titre croissant
  else {
    db.quests.find({}).sort({
      title: 1
    }).exec((err, docs) => {
      utils.logError(1, err, "GET OK : All quests");
      res.json(docs);
    });
  }
}


/**
 * @desc POST /quests : Insère une quête en base de donnée.
 * @param {Quest} La quête à insérer.
 * @return {Quest} La quête insérée si succès, texte sinon.
 */
function postQuest(req, res) {
  utils.logColor(3, 0, "POST .. : Quest");
  db.quests.insert(req.body, (err, newQuest) => {
    if (err != null) {
      utils.logColor(1, 2, "POST KO : Quest");
      res.status(400).send("Quete deja existante !");
    } else {
      utils.logError(1, err, "POST OK : Quest");
      res.status(201).json(newQuest);
    }
  });
}


/**
 * @desc GET /quests/:id : Récupère la quête avec _id=id.
 * @return {Quest} La quête trouvée, vide sinon.
 */
function getQuest(req, res) {
  utils.logColor(3, 0, "GET .. : Quest ", req.params.id);
  db.quests.findOne({
    _id: req.params.id
  }, (err, quest) => {
    utils.logError(1, err, "GET OK : Quest");
    res.status(200).send(quest);
  });
}


/**
 * @desc DELETE /quests/:id : Supprime quête avec _id=id.
 * @return {int} Le nombre de quêtes supprimées.
 */
function deleteQuest(req, res) {
  utils.logColor(3, 0, "DELETE .. : Quest ", req.params.id);
  db.quests.remove({
    _id: req.params.id
  }, {}, (err, nbDel) => {
    utils.logError(1, err, "DELETE OK : Quest");
    res.status(200).send(nbDel.toString());
  });
}


/**
 * @desc PUT /quests/:id/objectives?descr=STRING :
 * Check l'objectif descr=STRING pour la quête _id=id.
 * @param {string} Description de l'objectif.
 * @return {Quest} La quête modifiée.
 */
function checkObjective(req, res) {
  utils.logColor(3, 0, "PUT .. : Check obj ", req.query.descr);
  utils.logColor(2, 0, "GET .. : Quest ", req.params.id);
  let objectiveDescr = req.query.descr;
  db.quests.findOne({
    _id: req.params.id
  }, (err, quest) => {
    utils.logError(2, err, "GET OK : Quest");
    var questUpdated = quest;
    for (let obj of questUpdated.objectives) {
      if (objectiveDescr === obj.descr) {
        obj.completed = true;
      }
    }

    var allCompleted = true;
    for (let obj of questUpdated.objectives) {
      if (!obj.completed)
        allCompleted = false;
    }

    if (allCompleted) {
      questUpdated.completed = true;
    }

    db.quests.update({
      _id: questUpdated._id
    }, questUpdated, {
      returnUpdatedDocs: true
    }, (err, nbUpdated, docUpdated) => {
      utils.logError(1, err, "PUT OK : Check obj");
      res.status(201).send(docUpdated);
    })
  });
}




// BATCH
app.route("/batch")
  .get((req, res) => {
    var doc = require("./batch/quests.json");
    var bdd = db.quests;

    utils.logColor(3, 0, "BATCH ON ", bdd.filename, " ...");
    bdd.insert(doc, (err, newDocs) => {
      res.status(200).send(newDocs);
      utils.logError(1, err, "BATCH OK");
    });
  });




// 404
app.use((req, res, next) => {
  res.status(404).send('Page introuvable !');
  utils.logColor(3, 6, "404");
});




app.listen(8080, () => {
  utils.logColor(3, 7, "Serveur OK sur le port 8080");
});
