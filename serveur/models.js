var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');


var MessageSchema = new mongoose.Schema({
	_id: { type: String, index: true ,default: mongoose.Types.ObjectId },
	content: {type: String, required:true},
	author : { type : String, required:true}, 
	receiver : { type : String , default : null},
	date : { type : Date }
});
exports.Message = mongoose.model('Message', MessageSchema);


var PersonSchema = new mongoose.Schema({
	_id: { type: String, index: true },
	name: { type: String, required: true } //,
	//messages: [MessageSchema]
});

exports.Person = mongoose.model('Person', PersonSchema);

