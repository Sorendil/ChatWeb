var models = require('./models.js');


exports.methodNotAllowed = function(req, res) {
    res.send(405, 'Method not allowed');
};

exports.getAllPersons = function(req, res) {
    models.Person.find(null, 'name', function(err, persons) {
        persons = persons.map(function(person) {
            person = person.toJSON();
            person.url = '/' + person._id;
            return person;
        });
        res.send(persons);
    });
};

exports.getPerson = function(req, res) {
    var slug = req.params.person;
    models.Person.findById(slug, 'name description messages', function(err, person) {
        if (person === null) {
            res.send(404, 'Not found');
        } else {
            person = person.toJSON();
            person.url = '/' + person._id;
            person.messages = person.messages.map(function(message) {
                message.url = person.url + '/' + message._id;
                return message;
            });
            res.send(200, person);
        }
    });
};

exports.setPerson = function(req, res) {
    if (!req.body.hasOwnProperty('name')) {
        res.send(400, 'The "name" parameter is required');
    }

    var slug = req.params.person;
    models.Person.findById(slug, function(err, person) {
        if (err) {
            res.send(500, err);
        }

        var statusCode;
        if(person === null) {
            statusCode = 201; // created
            person = new models.Person(req.body);
            person._id = slug;
        } else {
            statusCode = 200; // OK
            person.name = req.body.name;
            person.description = req.body.description;
        }

        person.save(function(err) {
            if (err) {
                res.send(500, err);
            }
            else {
                res.send(statusCode, person);
            }
        });
    });
};

exports.deletePerson = function(req, res) {
    var slug = req.params.person;
    models.Person.findById(slug, function(err, person) {
        if (person !== null) {
            person.remove();
            res.send(200);
        } else {
            res.send(404);
        }
    });
};

exports.getMessage = function(req, res) {
    var slug = req.params.person;
    var messageSlug = req.params.message;

    models.Person.findById(slug, function(err, person) {
        if (person === null) {
            res.send(404, 'Person not found');
        }

        var message = person.messages.id(messageSlug);
        if (message === null) {
            res.send(404, 'Message not found');
        } else {
            res.send(200, message);
        }
    });
};

exports.getMessageFromPerson = function(req, res) {
    var slug = req.params.person;
    
    models.Person.findById(slug, function(err, person) {
        if (person === null) {
            res.send(404, 'Person not found');
        }
        // works privatebox : []
        var bundle = {chatroom : [] , privatebox : {} } ;
        
        var i = 0;
        for(i = 0 ; i <  person.messages.length ; i++){
    
            if(person.messages[i].destinataire === 'all'){
                bundle.chatroom[bundle.chatroom.length] = person.messages[i];
            //do something cool here
            }
            else{
                // works bundle.privatebox[bundle.privatebox.length] =  person.messages[i];
                var destinataire =  person.messages[i].destinataire;
                bundle.privatebox[destinataire] = bundle.privatebox[destinataire]  ||[];
                bundle.privatebox[destinataire].push(person.messages[i]);
               // bundle.privatebox[person.messages[i].destinataire]=  person.messages[i];
                               
            }

        }        



        if (bundle === null) {
            res.send(404, 'Message not found');
        } else {
            res.send(200, bundle);
        }
    });
};



exports.setMessage = function(req, res) {
    var slug = req.params.person;
    var messageSlug = req.params.message;

    models.Person.findById(slug, function(err, person) {
        if (person === null) {
            res.send(404, 'Not found');
        } else {
            var message = person.messages.id(messageSlug);
            var statusCode;

            if (message === null) {
                message = new models.Message(req.body);
                message._id = messageSlug;
                person.messages.push(message);
                statusCode = 201;
            } else {
                message.content = req.body.content;
                statusCode = 200;
            }

            person.save();
            res.send(statusCode, message);
        }
    });
};


exports.sendMessage = function(req, res) {
    var slug = req.params.person;
   
    models.Person.findById(slug, function(err, person) {
        if (person === null) {
            res.send(404, 'Not found');
        } 

        else {

            if (models.Person.findById(req.body.destinataire) != null){

                person.messages.push({ content : req.body.content,
                //date : req.body.date,  
                destinataire : req.body.destinataire  });
            }   

            statusCode = 200;
        }

            person.save();
            res.send(statusCode);
        });
   
};




exports.deleteMessage = function(req, res) {
    var slug = req.params.person;
    var messageSlug = req.params.message;

    models.Person.findById(slug, function(err, person) {
        if (person === null) {
            res.send(404, 'Person not found');
        } else {
            var message = person.messages.id(messageSlug);

            if (message === null) {
                res.send(404, 'Message not found');
            } else {
                message.remove();
                person.save();
                res.send(200);
            }
        }
    });
};

exports.createComment = function(req, res) {
    var slug = req.params.person;
    var messageSlug = req.params.message;

    
    if (!req.body.hasOwnProperty('body')) {
        res.send(400, 'The "body" parameter is required');
    }
    
    models.Person.findById(slug, function(err, person) {
        if (person === null) {
            res.send(404, 'Person not found');
        } else {
            var message = person.messages.id(messageSlug);
            if (message === null) {
                res.send(404, 'Message not found');
            } else {
                var comment = { body: req.body.body };
                message.comments.push(comment);
                person.save();

                res.send(201, comment);
            }
        }
    });
};