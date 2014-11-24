var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');


var MessageSchema = new mongoose.Schema({
	_id: { type: String, index: true },
	content: {type: String, required:true},
	//date : { type: Date, default: Date.now },
	destinataire : { type : String, default : 'all', required : true }
});
exports.Message = mongoose.model('Message', MessageSchema);


var PersonSchema = new mongoose.Schema({
	_id: { type: String, index: true },
	name: { type: String, required: true },
	messages: [MessageSchema]
});

exports.Person = mongoose.model('Person', PersonSchema);