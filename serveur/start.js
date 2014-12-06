var express = require('express');
var mongodb = require('mongodb');
var models = require('./models.js');
var routes = require('./routes.js');
var EventEmitter = require("events").EventEmitter;

 
 
mongodb.connect("mongodb://localhost/test", function(err, db) {
	if(err) { 
		return console.dir(err); 
	}
 
	
	exports.db = db;
});
 
/**
 * Tableau de requêtes
 * Type : Tableau d'objets de forme 
 *  {
 *    author : String,
 *    resp : ?,
 *    con : ?
 *  }
 */
var requests = [];
exports.requests = requests;
var handler = require('./handler.js');
// Le gestionnaire des messages en attente
var emitter = new EventEmitter();
// Lorsqu'on reçoit une notification de nouveau message sur la chatbox,
// On relache toutes les requêtes en attente
emitter.on('newChatBoxMessage',handler.ChatBoxMessageHandler);
// Lorsqu'un reçoit une notification de nouveau message privé
emitter.on('newPrivateMesssagingMessage',handler.PrivateBoxMessageHandler);
 
// ICI :
// Faire un setInterval toutes les secondes qui regarde chaque requête et les libères si elles sont agées de 10 secondes !
 
exports.emitter = emitter;
 
 
 
 
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
 
    next();
};
 
 
 
 
var app = express();
app.use(express.bodyParser());
app.use(allowCrossDomain);
 
// last active users
//app.use(routes.registerPeople);
 
// List of persons ressource
app.get('/', routes.getAllPersons);
app.put('/', routes.methodNotAllowed);
app.post('/', routes.methodNotAllowed);
app.delete('/', routes.methodNotAllowed);
 
// Message ressource
app.get('/messages', routes.getAllMessages);
app.get('/messages/:person', routes.getPersonsMessages);
app.post('/messages/:person', routes.sendMessage);
app.delete('/messages/:person', routes.deleteMessage);
 
 
// Person ressource
app.get('/:person', routes.getPerson);
app.put('/:person', routes.methodNotAllowed);
app.post('/:person', routes.setPerson);
app.delete('/:person', routes.deletePerson);
 
// Message ressource
app.get('/:person/:message', routes.getMessage);
app.post('/:person/:message', routes.methodNotAllowed);
app.delete('/:person/:message', routes.deleteMessage);
 
 
 
 
app.listen(process.env.PORT || 1337);
console.log('Listening on port 1337');