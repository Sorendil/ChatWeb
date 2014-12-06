var start = require('./start.js');
var routes = require('./routes.js');

var requests = start.requests;


function ChatBoxMessageHandler(){

    // Tant qu'il reste une requête dans le tableau de requêtes
    while (requests.length > 0) {
        // On récupère la première requête du tableau et on l'enlève
        var rep = requests.shift();
    	routes.getMessages(rep.author,rep.resp,rep.con);
        console.log("group message sent to "+rep.author);
    }


}



function PrivateBoxMessageHandler(sender,receiver){

	var index = findPersonIndex(receiver,requests);
	if (index != -1){
		var rep = requests[index];
        requests.splice(index,1);
        //console.log(start.requests);
        routes.getMessages(rep.author,rep.resp,rep.con);
        console.log("private message sent to "+rep.author);
	}





}

 
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
 

exports.ChatBoxMessageHandler = ChatBoxMessageHandler;
exports.PrivateBoxMessageHandler = PrivateBoxMessageHandler;