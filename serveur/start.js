var express = require('express');
var mongodb = require('mongodb');
var models = require('./models.js');
var routes = require('./routes.js');
var EventEmitter = require("events").EventEmitter;

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
 
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
emitter.on('newChatBoxMessage', handler.ChatBoxMessageHandler);
// Lorsqu'un reçoit une notification de nouveau message privé
emitter.on('newPrivateMesssagingMessage', handler.PrivateBoxMessageHandler);

 
exports.emitter = emitter;
 
 
 
 
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
 
    next();
};
 
 
 
 

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

// Push network mode
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  
  socket.pseudo="";
  
  socket.on('setPseudo', function(pseudo) {
    socket.pseudo = pseudo;
    console.log('PSEUDO');
    console.log(socket.pseudo);
  });
  
  socket.on('askForUpdate', function() {
    console.log('Ask for update !');
    routes.getMessages(socket.pseudo, null, null, socket);
  });
  
  socket.on('pushModeEnable', function() {
    socket.join('askingForNews');
    console.log('user asking for enabling push mode');
  });
  socket.on('pushModeDisable', function() {
    socket.leave('askingForNews');
    console.log('user asking for disabling push mode');
  });
});

// On envoie les messages à tous les connectés qui sont en mode push (donc qui sont dans le groupe 'askingForNews'
exports.sendNewMessages = function(privateMessagingPseudos) {
  // Pour chaque socket qui demande à être notifié
  var clients = io.sockets.adapter.rooms['askingForNews'];
  if (clients != undefined)
  {
    for (var clientId in clients) {
      client_socket = io.sockets.connected[clientId];
      
      if( ! privateMessagingPseudos || privateMessagingPseudos.sender == client_socket.pseudo || privateMessagingPseudos.receiver == client_socket.pseudo)
        routes.getMessages("Sorendil", null, null, client_socket);
    }
  }
};
 
http.listen(1337, function(){
    console.log('listening on *:1337');
});
