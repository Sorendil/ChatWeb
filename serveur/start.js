var express = require('express');

var models = require('./models.js');
var routes = require('./routes.js');

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

var app = express();
app.use(express.bodyParser());
app.use(allowCrossDomain);

// List of persons ressource
app.get('/', routes.getAllPersons);
app.put('/', routes.methodNotAllowed);
app.post('/', routes.methodNotAllowed);
app.delete('/', routes.methodNotAllowed);

// Message ressource
app.get('/messages/:person', routes.getMessageFromPerson);
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