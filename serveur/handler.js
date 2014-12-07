var start = require('./start.js');
var routes = require('./routes.js');

var requests = start.requests;


function ChatBoxMessageHandler(){

    // Tant qu'il reste une requête dans le tableau de requêtes
    while (requests.length > 0) {
        // On récupère la première requête du tableau et on l'enlève
        var rep = requests.shift();
    	clearTimeout(rep.time_out);
        routes.getMessages(rep.author,rep.resp,rep.con);
        console.log("group message sent to "+rep.author);
    }


}



function PrivateBoxMessageHandler(sender,receiver){

	var index = routes.findPersonIndex(receiver,requests);
	if (index != -1){
		var rep = requests[index];
        clearTimeout(rep.time_out);
        requests.splice(index,1);
        //console.log(start.requests);
        routes.getMessages(rep.author,rep.resp,rep.con);
        console.log("private message sent to "+rep.author);
	}





}

 

 

exports.ChatBoxMessageHandler = ChatBoxMessageHandler;
exports.PrivateBoxMessageHandler = PrivateBoxMessageHandler;