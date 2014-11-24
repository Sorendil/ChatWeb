
var scrollBottom = function( $block ) {
    $block.scrollTop($block.prop("scrollHeight"));
};

jQuery.fn.extend({
    scrollBottom: function() {
        this.scrollTop(this.prop("scrollHeight"));
}});

$.ajaxSetup({ cache: false });


$( document ).ready(function() {

    // ======== DONNEES
    // ====================
    
    // ======= CHAT BOX
    
    // Le <input> d'envoi de messages pour la Chatbox
    $chatBoxWriteMessage = $("#chatBoxWriteMessage");
    $chatBoxForm = $("#chatBoxForm");
    $chatBoxMessages = $("#chatBoxMessages");
    
    console.log((new Date()).getTime());
    
    // A l'envoi du formulaire
    $chatBoxForm.submit(function( event ) {
        // On gère le formulaire en Ajax, on change pas de page
        event.preventDefault();
        
        // Le contenu du message
        chatBoxMessage_content = encodeURIComponent( $chatBoxWriteMessage.val() );
        
        $chatBoxMessages.append(
            "<div class=\"ChatBoxMessage-message\">"
            + "<div class=\"ChatBoxMessage-author\">"
            + "Pseudo"
            + "</div>"
            + "<div class=\"ChatBoxMessage-content\">"
            + decodeURIComponent(chatBoxMessage_content)
            + "</div>"
            + "</div>");
            
        // On affiche le bas des messages
        $chatBoxMessages.scrollBottom();
        
        // On efface le input
        $chatBoxWriteMessage.val("");
        //console.log( "Handler for .submit() called." );
    });
    
    // ======== PSEUDO LIST
    $pseudoList = $("#pseudoList");
    
    // Récupération des pseudos toutes les 5 secondes
    setInterval(function(){
        $.ajax("tests/pseudoList.json", {
            dataType: "json"
        })
        .done( function( data ){
        
            // La liste des pseudos
            pseudos = data.pseudos;
            
            // On vide l'affichage des pseudos
            $pseudoList.empty();
            
            // Pour chaque pseudo
            $.each( pseudos, function( key, pseudo ) {
                //console.log(pseudo);
                $pseudoList.append(
                    "<li class=\"PseudoList-pseudoItem\">"
                    + "<a data-pseudo=\""
                    + pseudo
                    + "\" class=\"PseudoList-pseudo js-PseudoList-pseudo\" href=\"#\">"
                    + pseudo
                    + "</a></li>");
            });
            
        })
        .fail( function(data) {
            //console.log("fichier non charge");
        });
    }, 4000);
    
    // Container des messageries privées
    $privateMessagingContainer = $("#privateMessagingContainer");
    
    // Pour chaque pseudo, ouvrir une fenetre de discussion si elle n'est pas déjà ouverte
    // Note : Utilisation de on au lieu de click car un seul gestionnaire d'événement gère les écouteurs
    // de cette manière, on a pas besoin de recréer les écouteurs à chaque fois qu'on ajoute un pseudo
    $pseudoList.on('click', '.js-PseudoList-pseudo', function(event) {
        event.preventDefault();
        
        // La cible de l'événement, soit l'élément <a> qui contient le pseudo
        $pseudoLink = $(this);
        pseudoName = $pseudoLink.data("pseudo");
        
        // On cherche si une messagerie privée existe déjà avec cette personne
        console.log($privateMessagingContainer);
        // On récupère toutes les messageries privées qui correspondent au pseudo (soit 1 soit 0)
        $privateMessagings = $privateMessagingContainer.find('[data-receiver="' + pseudoName + '"]');
        // Si on n'a pas trouvé une messagerie privée correspondante ouverte
        if ( ! $privateMessagings.length)
        {
            // On ajoute une nouvelle messagerie privée correspondante !
            $privateMessagingContainer.append(
                " <div class=\"Main-PrivateMessaging\">"
                + "<div data-receiver=\"" + pseudoName + "\" class=\"PrivateMessaging\">"
                
                //header
                + "<header class=\"PrivateMessaging-header\">"
                + "<h1 class=\"PrivateMessaging-title\"><span>"
                + pseudoName
                + "</span></h1></header>"
                
                //content
                + "<div class=\"PrivateMessaging-content\">"
                + "<div class=\"PrivateMessagingMessage js-PrivateMessagingMessage\">"
                + "</div>" //.PrivateMessagingMessage
                + "</div>" //.PrivateMessaging-content
                
                //write message
                + "<div class=\"PrivateMessaging-writeMessageContent\">"
                + "<div class=\"PrivateMessaging-writeMessage\">"
                + "<form id=\"privateMessagingForm-" + pseudoName + "\" action=\"#\">"
                + "<input type=\"text\" name=\"privateMessagingWriteMessage-" + pseudoName + "\" id=\"privateMessagingWriteMessage-" + pseudoName + "\" placeholder=\"Ecrivez votre message\" />"
                + "</form>"
                + "</div>" //.PrivateMessaging-writeMessage
                + "</div>" //.PrivateMessaging-writeMessageContent
                
                + "</div>" //.PrivateMessaging
                + "</div>" //.Main-PrivateMessaging
            );
        }
    });
    
    var k = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],  
        n = 0; 
    $(document).keydown(function (e) {  
        if (e.keyCode === k[n++]) {  
            if (n === k.length) {
                var randomnumber = Math.floor(Math.random() * (7 + 1));
                $(".Main .Main-row:first").prepend("<img src=\"images/knm/" + randomnumber + ".gif\" ∕>");
                n = 0;
                return !1  
            }  
        } else n = 0  
    }); 
    
    
    // ========== TRAITEMENT DES MESSAGES RECUS
    
    // Récupération des messages toutes les 5 secondes
    setInterval(function(){
        $.ajax("tests/messages.json", {
            dataType: "json"
        })
        .done( function( data ){
            manageChatBoxMessages( data );
            managePrivateMessagingMessages( data );
        })
        .fail( function(data) {
            console.log("fichier non charge");
        });
    }, 2000);
    
    // Traitement des messages de la chat box
    var manageChatBoxMessages = function( data ) {
        // La liste des messages de la chatbox
        chatBoxMessages = data.chatbox.messages;
        
        manageMessages( $chatBoxMessages, chatBoxMessages, "ChatBoxMessage", false );
    };
    
    // Traitement des messages de messagerie privée
    var managePrivateMessagingMessages = function( data ) {
        // La liste des différentes fils de discussion
        privateRooms = data.privateRooms;
        
        // Pour chaque Messagerie Privée
        $.each( privateRooms, function( key, privateRoom ) {
            // La liste des messages récupérés pour la messagerie privée courante
            privateRoomMessages = privateRoom.messages;
            
            // Le pseudo
            pseudoName = privateRoom.receiver;
            
            // On récupère le container des messages de la messagerie privée si elle est ouverte
            $privateRoomContainer = $privateMessagingContainer.find('[data-receiver="' + pseudoName + '"]');
            
            // Si il est bien ouvert (donc si on a bien trouvé le container)
            if ($privateRoomContainer.length)
            {
                $privateRoomMessagesContainer = $privateRoomContainer.find(".js-PrivateMessagingMessage");
                manageMessages( $privateRoomMessagesContainer, privateRoomMessages, "PrivateMessagingMessage", true );
            }
        });
    };
    
    /**
     * Gère les messages pour un bloc de message et des messages donnés
     * @param $messagesContainer L'élément du DOM contenant les messages à insérer/gérer
     * @param messages La liste des messages en objet json
     * @param blocMessageName Le nom du bloc HTML des messages
     * @param privateMessaging booléen : vrai si il s'agit de messages d'une messagerie privée, faux pour la chatbox
     */
    var manageMessages = function( $messagesContainer, getMessages, blocMessageName, privateMessaging ) {
        
        // Les messages déjà existants dans le DOM et leur nombre
        $existingMessages = $messagesContainer.children();
        nbExistingMessages = $existingMessages.length;
        
        // L'ID courant du message existant. 
        // Pour l'instant, on en est au premier, donc 0
        currentIdExistingMessage = 0;
        
        // Les messages récupérés en json et leur nombre
        // messages
        nbGetMessages = getMessages.length;
        
        // L'ID courant du message récupéré.
        // Pour l'instant on en est au premier donc 0
        currentIdGetMessage = 0;
        
        // Pour enlever le Chargement en cours
        if ( ! nbExistingMessages )
        {
            $messagesContainer.empty();
        }
        
        while( currentIdExistingMessage < nbExistingMessages ||
            currentIdGetMessage < nbGetMessages ) {
            
            // Si il n'y a plus de messages existants
            if ( currentIdExistingMessage >= nbExistingMessages )
            {
                message = getMessages[currentIdGetMessage];
                
                // on ajoute les messages entrants à la suite
                $messagesContainer.append(
                    "<div data-message-time=\"" + message.time + "\" data-message-id=\"" + message.id + "\" class=\"" + blocMessageName + "-message\">"
                    + "<div class=\"" + blocMessageName + "-author\">"
                    + message.author
                    + "</div>"
                    + "<div class=\"" + blocMessageName + "-content\">"
                    + message.content
                    + "</div></div>");
                
                currentIdGetMessage++;
            }
            // Si il reste au moins un message déjà existant (dans le DOM)
            else
            {
                // Si il ne reste plus de message entrant à vérifier
                if ( currentIdGetMessage >= nbGetMessages )
                {
                    // Alors on n'a plus rien à faire et il faut dire à la boucle de s'arrêter en forcant la condition d'arrêt
                    currentIdExistingMessage = nbExistingMessages;
                }
                // Si on est dans le cas où il reste au moins un message existant à vérifier et au moins un message entrant à vérifier
                else
                {
                    // Si le message existant et le message entrant courant est le meme
                    if ( $existingMessages.eq(currentIdExistingMessage).data( "messageId" )
                    == getMessages[currentIdGetMessage].id )
                    {
                        // Alors on a rien à faire pour ces deux messages
                        // et on avance le curseur des messages existants
                        // et des messages récupérés
                        currentIdExistingMessage++;
                        currentIdGetMessage++;
                    }
                    // Si le message existant courant est plus vieux que le message récupéré courant
                    else if ( $existingMessages.eq(currentIdExistingMessage).data( "messageTime" ) <= getMessages[currentIdGetMessage].time )
                    {
                        // Alors on avance le curseur des messages existants
                        currentIdExistingMessage++;
                    }
                    // Sinon, si le message existant courant est plus jeune que le message récupéré courant
                    else
                    {
                        message = getMessages[currentIdGetMessage];
                        $existingMessages.eq(currentIdExistingMessage).before(
                            "<div data-message-time=\"" + message.time + "\" data-message-id=\"" + message.id + "\" class=\"" + blocMessageName + "-message\">"
                            + "<div class=\"" + blocMessageName + "-author\">"
                            + message.author
                            + "</div>"
                            + "<div class=\"" + blocMessageName + "-content\">"
                            + message.content
                            + "</div></div>");
                        
                        // On avance le curseur des messages récupérés
                        currentIdGetMessage++;
                    }
                }
            }
        }
        
        
        // Pour chaque message
        /*$.each( messages, function( key, message ) {
            
            while( currentIdExistingMessage < nbExistingMessages )
            {
                if( $existingMessages[currentIdExistingMessage]
            }
            if ( $nbMessagesBefore )
            {
                // Si il y a déjà des messages existants
                
            }
            else
            {
                // Si il n'y avait pas encore de messages existants,
                // on les ajoute à la suite
                $messagesContainer.append(
                    "<div data-message-time=\"" + message.time + "\" data-message-id=\"" + message.id + "\" class=\"" + blocMessageName + "-message\">"
                    + "<div class=\"" + blocMessageName + "-author\">"
                    + message.author
                    + "</div>"
                    + "<div class=\"" + blocMessageName + "-content\">"
                    + message.content
                    + "</div></div>");
            }
            
        });*/
    };
    
});
