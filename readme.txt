dans le dossier de nodejs
npm install -g express
npm install -g express-generator
dans le dossier de mongodb
mongodb --dbpath  emplacementdossierbasededonnee (definir la base de donnée , ce qui va lancer la bdd)
node start.js
http://localhost:1337/

pour ajouter manuellement 


avoir la liste des collections 
db.getCollectionNames()

pour ajouter une personne
db.people.insert({'name': 'johann', 'description' :' lol'})

db.collection.find(<criteria>, <projection>)

exemple :
db.bios.find( { _id: 5 } )
returns documents in the bios collection where _id equals 5
http://docs.mongodb.org/manual/reference/method/db.collection.find/
db.createCollection("log", { capped : true, size : 5242880, max : 5000 } )