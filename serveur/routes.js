var models = require('./models.js');
var start = require('./start.js');
var mongoose = require('mongoose');
var mongodb = require('mongodb');
var EventEmitter = require("events").EventEmitter;
var url = require('url');

exports.methodNotAllowed = function(req, res) {
    res.send(405, 'Method not allowed');
};

exports.getAllPersons = function(req, res) {
    models.Person.find(null, 'name', function(err, persons) {
        persons = persons.map(function(person) {
            person = person.toJSON();
            return person;
        });
        res.send(persons);
    });
};

exports.getAllMessages = function(req, res) {
    models.Message.find(null,null, function(err, messages) {
        messages = messages.map(function(message) {
            message = message.toJSON();

            return message;
        });
        res.send(messages);
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
   
exports.getPersonsMessages = function(req, res) {
    var con ;
    var db = start.db;
    var collection = db.collection('active');
    collection.find().toArray(function(err,results){
        if(err){
            console.log("fuck it");
        }
        var networkMode = url.parse(req.url, true).query.networkMode); // Le mode réseau
        // si le mode choisit est polling
        if ( 0 == networkMode ) {
            getMessages(req.params.person,res,results);
        }
        // mode long polling
        else if( 1 == networkMode ){
            // bundle contenant la requête qui est en suspend et les personnes actives
            var rep = { author : req.params.person ,resp : res  , con : results  };
            start.requests.push(rep);
            
            start.emitter.on(req.params.person,getMessages);
          
        }
        // mode push
        else if ( 2 == networkMode ) {
            console.log("mode push");
        }
        else {
            console.log("unknown mode");
        }

        con =  results;

    });
   
   
        var gift = new Object();
        var nb ;

    /* vérifier que le nom n'est pas déjà présent dans la liste des connectés
        la collection est limité à 10 personnes 
    */
    collection.count({ name : req.params.person },function (err, nbdocs){
        if (req.params.person != null && nbdocs < 1) {
            console.log(req.params.person);
            gift.name = req.params.person;

            collection.insert(gift,function(err, records){
                if(err)
                    console.log(err);
                
            });
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

            var msg = new models.Message({ author : person.name , content : req.body.content , receiver : req.body.receiver });

            
            msg.save(function (err){
                if(err){
                    res.send(500,"pff");
                }
                else {
                        // efface la premier requête puis l'envoi la fonction callback de getPersonsMessages
                        var receiver = req.body.receiver;
                        // si ce message est privé
                        if ( receiver != null) {                       
                            var index = findPersonIndex(receiver,start.requests);
                            if ( index != -1){
                                var rep = start.requests[index];
                                start.requests.splice(index,1);
                                console.log(start.requests);
                                start.emitter.emit(receiver,receiver,rep.resp,rep.con);
                            }
                        }
                        // si message pour la chatbox déclencher la réponse de tout le monde
                        else {

                            var j = 0;
                            while (start.requests.length > 0){
                                var rep = start.requests.shift();
                                start.emitter.emit(rep.author,rep.author,rep.resp,rep.con);
                                
                            }
                               
                        }

                    }
                    res.send(200,"impec");
            });

        }

          
    });
   
};


function findPersonIndex(name,tab){
    var i = 0;
    while ( i < tab.length  && tab[i].author != name ){
        i++;
    }
    if ( i < tab.length)
        return i;
    else
        return -1;
}




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






// fonction callback à laquelle on passera les noms et la requête 
// elle recoit ce que le trigger lui envoie dans sendMessage
function getMessages(name,res,con){
    var slug = name;
    var bundle = {chatroom : [] , privatebox : [], connected : [] } ;
    models.Person.findById(slug, function(err, person) {
        // si l'utisateur n'existe pas on le crée
        if (person === null) {
            var p = new models.Person();
            p._id = name;
            p.name = name;
            p.save(function(err){
                if(err){
                    console.log("user creation failed");
                    res.send(500,"you got screwed dude");
                }
                else{
                    res.send(201,bundle);
                    console.log("OK user created");
                }
            });
            
        }

        else{        
        // Sinon
            var privatebox_messages =  models.Message.find( { 
                receiver : { $ne : null  },  
                $or: [  {receiver : person} , {author : person  } ]},
                function (err,docs){

                    if (err) {
                        res.send(500, err);
                    }
                    else {
                        var convo = [];

                        docs.map( function (msg) {
                        
                            var sender =  (msg.author == person.name) ? msg.receiver : msg.author;
                            msg.date = new mongoose.Types.ObjectId(msg._id).getTimestamp().getTime();
                            convo[sender] = convo[sender] || [] ;
                            convo[sender].push(msg);  

                        }) ;
                  
                   
                        //console.log(bundle.privatebox);
                        var tab_convo = []
                        for( var p in convo){
                        var conv = new Object();
                        conv.receiver = p;
                        conv.msgs = [];
                        conv.msgs = convo[p];
                        tab_convo.push(conv);
                        }

                        //console.log(tab_convo);
                        bundle.privatebox = tab_convo;

                        var chatbox_messages =  models.Message.find( { receiver : null},
                        function (err, dcs) {
                            if (err) {
                                res.send(500, err);
                            }
                            else {
                                dcs = dcs.map(function(doc) {
                                        //console.log(new mongoose.Types.ObjectId(doc._id).getTimestamp());
                                        doc.date = new mongoose.Types.ObjectId(doc._id).getTimestamp().getTime();
                                        return doc;
                                });

                                bundle.connected = con;
                                bundle.chatroom = dcs;
                                
                                //console.log(bundle);
                                res.send(200, bundle);
                            }
                        });
                    }
                });



           
        }
    
    });  
}
