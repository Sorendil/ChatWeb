
/**
 * DONNEES
 */

// Si déconnecté alors null
var socket = null;

userPseudo = "";
var api_root;

// Le <input> d'envoi de messages pour la Chatbox
var $chatBoxWriteMessage;
var $chatBoxForm;
var $chatBoxMessages;

// Container des messageries privées
var $privateMessagingContainer;

// ======== PSEUDO LIST
var $pseudoList;

// Refresh Feedback Image
var refreshFeedbackImg = 0;
var $refreshImage;

// LongPolling attributes
var lastLongPollingAge = 0;
var maxLongPollingAge = 22; // Secondes
var waitingForResponseLongPolling = false;

// ======== MENU
var $menu;
var networkMode = 0; // 0 Pour Polling, 1 pour LongPolling, 2 pour Push


/**
 * Fonction scrollBottom
 */
jQuery.fn.extend({
    scrollBottom: function() {
        this.scrollTop(this.prop("scrollHeight"));
}});

/**
 * Pour ne pas mettre en cache les résultats des messages
 */
$.ajaxSetup({ cache: false });

/**
 * Gère les messages pour un bloc de message et des messages donnés
 * @param $messagesContainer L'élément du DOM contenant les messages à insérer/gérer
 * @param messages La liste des messages en objet json
 * @param blocMessageName Le nom du bloc HTML des messages
 * @param privateMessagingWith Nom du destinataire si il s'agit de messages d'une messagerie privée, false pour la chatbox.
 * @return L'ID du dernier message reçu par le destinataire dans le cas d'une messagerie privée si il existe,
 * rien s'il n'existe pas ou si il s'agit de la chatbox
 */
var manageMessages = function( $messagesContainer, getMessages, blocMessageName, privateMessagingWith ) {
    
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
    
    // Temps du dernier message reçu
    lastTimeMessageReceived = null;
    
    // Pour enlever le Chargement en cours
    if ( ! nbExistingMessages )
    {
        $messagesContainer.empty();
    }
    
    while( currentIdGetMessage < nbGetMessages ) {
        
        currentGetMessage = getMessages[currentIdGetMessage];
        
        // Si on est en mode messagerie privée
        // et si le message reçu courant n'est pas un message de l'utilisateur actuel
        if ( privateMessagingWith &&
            currentGetMessage.author != userPseudo)
        {
            lastTimeMessageReceived = currentGetMessage.date;
        }
        
        // Si il n'y a plus de messages existants
        if ( currentIdExistingMessage >= nbExistingMessages )
        {
            // on ajoute les messages entrants à la suite
            $messagesContainer.append(
                "<div data-message-time=\"" + currentGetMessage.date + "\" data-message-id=\"" + currentGetMessage._id + "\" class=\"" + blocMessageName + "-message\">"
                + "<div class=\"" + blocMessageName + "-author\">"
                + currentGetMessage.author
                + "</div>"
                + "<div class=\"" + blocMessageName + "-content\">"
                + currentGetMessage.content
                + "</div></div>");
            
            currentIdGetMessage++;
            
            $messagesContainer.scrollBottom();
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
                == currentGetMessage._id )
                {
                    // Alors on a rien à faire pour ces deux messages
                    // et on avance le curseur des messages existants
                    // et des messages récupérés
                    currentIdExistingMessage++;
                    currentIdGetMessage++;
                }
                // Si le message existant courant est plus vieux que le message récupéré courant
                else if ( $existingMessages.eq(currentIdExistingMessage).data( "messageTime" ) <= currentGetMessage.date )
                {
                    // Alors on avance le curseur des messages existants
                    currentIdExistingMessage++;
                }
                // Sinon, si le message existant courant est plus jeune que le message récupéré courant
                else
                {
                    $existingMessages.eq(currentIdExistingMessage).before(
                        "<div data-message-time=\"" + currentGetMessage.date + "\" data-message-id=\"" + currentGetMessage._id + "\" class=\"" + blocMessageName + "-message\">"
                        + "<div class=\"" + blocMessageName + "-author\">"
                        + currentGetMessage.author
                        + "</div>"
                        + "<div class=\"" + blocMessageName + "-content\">"
                        + currentGetMessage.content
                        + "</div></div>");
                    
                    // On avance le curseur des messages récupérés
                    currentIdGetMessage++;
                }
            }
        }
    }
    
    return lastTimeMessageReceived;
};

/**
 * Récupère le temps du dernier message reçu depuis un partenaire dans une messagerie privée
 */
var getLastTimeMessageReceived = function( getMessages, receiver )
{
    // Temps du dernier message reçu
    lastTimeMessageReceived = null;
    //console.log(getMessages);
    // Pour chaque message reçu
    $.each( getMessages, function( key, getMessage ) {
        if ( receiver != getMessage.author )
        {
            //console.log(receiver);
            //console.log(getMessage.author);
            lastTimeMessageReceived = getMessage.date;
        }
    });
    
    return lastTimeMessageReceived;
}

/**
 * Traitement des messages de la chatbox
 */
var manageChatBoxMessages = function( data ) {
    // La liste des messages de la chatbox
    chatBoxMessages = data.chatroom;
    
    manageMessages( $chatBoxMessages, chatBoxMessages, "ChatBoxMessage", false );
};

/**
 * Traitement des messages de messagerie privée
 */
var managePrivateMessagingMessages = function( data ) {
    // La liste des différentes fils de discussion
    privateRooms = data.privatebox;
    
    // Pour chaque Messagerie Privée
    $.each( privateRooms, function( key, privateRoom ) {
        // La liste des messages récupérés pour la messagerie privée courante
        privateRoomMessages = privateRoom.msgs;
        
        // Le pseudo
        pseudoName = privateRoom.receiver;
        
        // On récupère le container des messages de la messagerie privée si elle est ouverte
        $privateRoomContainer = $privateMessagingContainer.find('[data-receiver="' + pseudoName + '"]');
        
        // L'élément du pseudo
        $pseudo = $pseudoList.find('.js-PseudoList-pseudo[data-pseudo="' + pseudoName + '"]');
        
        // Si il est bien ouvert (donc si on a bien trouvé le container)
        if ($privateRoomContainer.length)
        {
            $privateRoomMessagesContainer = $privateRoomContainer.find(".js-PrivateMessagingMessageContainer");
            lastTimeMessageReceived = manageMessages( $privateRoomMessagesContainer, privateRoomMessages, "PrivateMessagingMessage", pseudoName );
        }
        // Si il est fermé
        else
        {
            lastTimeMessageReceived = getLastTimeMessageReceived( privateRoomMessages, userPseudo );
            
            //console.log(lastTimeMessageReceived);
            
            // Si l'ancien temps du message reçu est plus vieux que le nouveau
            if ( ( ! $pseudo.data( 'lastTimeMessageReceived' ) && lastTimeMessageReceived )
                || ($pseudo.data( 'lastTimeMessageReceived' ) < lastTimeMessageReceived ) )
            {
                // On notifie que l'utilisateur a écrit un nouveau message
                $pseudo.addClass('PseudoList-pseudoItem_new');
            }
            
        }
        
        // On met à jour le temps du dernier message reçu dans l'attribut data-last-time-message-received du pseudo en question
        $pseudo.data( 'lastTimeMessageReceived', lastTimeMessageReceived );
    });
};

var managePseudosList = function( data ) {
    // La liste des pseudos
    pseudos = data.connected;
    
    if ( ! pseudos )
    {
        pseudos = [];
    }

    // La liste des pseudos existants déjà dans le DOM
    $existingPseudos = $pseudoList.find('.js-PseudoList-pseudo');
    $existingPseudos.data("seen", false);

    // Pour enlever le Chargement en cours
    if ( ! $existingPseudos.length )
    {
        $pseudoList.empty();
    }

    // Pour chaque pseudo
    $.each( pseudos, function( key, pseudo ) {
        // On cherche si le pseudo est déjà dans le DOM
        $existingPseudo = $existingPseudos.filter('[data-pseudo=\"' + pseudo.name + '\"]');
        
        // Si il n'a pas été trouvé
        if ( ! $existingPseudo.length && pseudo.name != userPseudo )
        {
            $newPseudo = $("<li data-pseudo=\"" + pseudo.name + "\" class=\"PseudoList-pseudoItem js-PseudoList-pseudo\">"
                + "<a class=\"PseudoList-pseudo\" href=\"#\">"
                + pseudo.name
                + "</a></li>");
            $newPseudo.data("seen", "true");
            $pseudoList.append($newPseudo);
        }
        $existingPseudo.data("seen", "coucou");
    });
    // On supprime tous les pseudos qui n'ont pas été trouvés
    $existingPseudos.filter(function() { 
      return $(this).data("seen") == false 
    }).remove();
}

/**
 * Gestionnaire d'événements des envois de messages
 * @param event.target : Cible un formulaire <form>
 * @param event.data : Contient la variable isPrivateMessaging (booléen)
 */
var manageWriteMessages = function( event ) {
    // On gère le formulaire en Ajax, on change pas de page
    event.preventDefault();
    
    // Le formulaire
    // $(this)
    
    // Le input du message
    $messagingFormMessageInput = $(this).find(".js-messagingFormWriteMessage");
    
    //console.log($messagingFormMessageInput);
    
    // Le contenu du message
    messagingFormMessageContent = $messagingFormMessageInput.val();
    
    // Le bloc messagerie (ChatBox ou PrivateMessaging)
    $messagingBloc = $(this).parents('.js-Messaging');
    
    // Le container de messages
    $messagingMessageContainer = $messagingBloc.find('.js-MessagingMessageContainer');
    
    // On scroll pour afficher le bas des messages en attendant qu'il soit chargé
    $messagingMessageContainer.scrollBottom();
    
    // On efface le champs qu'on vient d'envoyer
    $messagingFormMessageInput.val("");
    
    // On envoie le message
    dataMessage = {
        content: messagingFormMessageContent,
        author: userPseudo
    }
    if (event.data.isPrivateMessaging)
        dataMessage.receiver = $messagingBloc.find('[data-receiver]').data('receiver');
        
    //console.log(dataMessage);
    $.ajax(api_root + "/messages/" + userPseudo, {
        type: "POST",
        data: dataMessage,
        success: function() {
            //alert("Success");
        }
    });
};

/**
 * Fonction appelée pour gérer les réponses
 */
var manageResponse = function( data ) {
    manageChatBoxMessages( data );
    managePrivateMessagingMessages( data );
    managePseudosList( data );
    refreshFeedback();
    
    // On redemande pour la requête LongPolling
    askForLongPollingRequest();
}

/**
 * Gestion du mode polling
 */
var pollingNetworkMode = function() {
    
    // Récupération des messages toutes les 2 secondes
    setInterval(function(){
        if( networkMode == 0 )
        {
            $.ajax(api_root + "/messages/" + userPseudo, {
                dataType: "json",
                data: {
                    networkMode: networkMode
                }
            
            })
            .done( function( data ){
                manageResponse( data );
            })
            .fail( function(data) {
                console.log("Informations non recuperees");
            });
        }
    }, 2000);
};

/**
 * Gestion du mode long polling
 */
var longPollingNetworkMode = function() {
    // Récupération des messages toutes les 2 secondes
    setInterval(askForLongPollingRequest, 2000);
};

/**
 * Quand appelé, envoie une requête si lastLongPollingAge vaut maxLongPollingAge
 */
var askForLongPollingRequest = function() {
    if( networkMode == 1 && ! waitingForResponseLongPolling )
    {
        waitingForResponseLongPolling = true;
        $.ajax(api_root + "/messages/" + userPseudo, {
            dataType: "json",
            data: {
                networkMode: networkMode
            }
        })
        .done( function( data ){
            manageResponse( data );
        })
        .fail( function(data) {
            console.log("Informations non recuperees");
        })
        .always( function() {
            // Dans tous les cas, on annonce que on n'attend plus de réponse pour LongPolling
            waitingForResponseLongPolling = false;
        });
    }
}

/**
 * Gestion du mode push
 */
var pushNetworkMode = function() {
    socket.on('newMessage', function(bundle) {
        manageResponse( bundle );
        console.log('Réponse en mode network push reçue !');
    });
};


var refreshFeedback = function() {
    $refreshImage.attr('src', 'images/refreshIcons/' + refreshFeedbackImg + '.png');
    $refreshImage.show( 0 );
    $refreshImage.delay( 500 ).hide( 0 );
    
    refreshFeedbackImg++;
    if (refreshFeedbackImg > 16) refreshFeedbackImg = 0;
}

var main = function() {
    // ======== DONNEES
    // ====================
    
    socket = io(api_root);
    socket.emit('setPseudo', userPseudo);
    
    // ======= CHAT BOX
    // Le <input> d'envoi de messages pour la Chatbox
    $chatBoxWriteMessage = $("#chatBoxWriteMessage");
    $chatBoxForm = $("#chatBoxForm");
    $chatBoxMessages = $("#chatBoxMessages");
    
    // Container des messageries privées
    $privateMessagingContainer = $("#privateMessagingContainer");
    
    // Image refresh feedback
    $refreshImage = $('.js-rf');
    
    // Gestion des événements des envois de messages
    $chatBoxForm.on("submit", { isPrivateMessaging: false }, manageWriteMessages);
    $privateMessagingContainer.on("submit", '.js-messagingForm', { isPrivateMessaging: true }, manageWriteMessages);
    
    // ======== PSEUDO LIST
    $pseudoList = $("#pseudoList");
    
    // ======== MENU
    $menu = $(".js-menu");
    
    $menu.on('click', 'a', function( event ) {
        event.preventDefault();
        
        $menu.find('a').removeClass('active');
        $( this ).addClass('active');
        
        // Si on était en mode push et qu'on change de mode
        if( 2 == networkMode && ! $( this ).hasClass('js-mode-push') )
        {
            // On doit informer le serveur qu'on ne veut plus être notifié
            socket.emit('pushModeDisable');
        }
        
        if ($( this ).hasClass('js-mode-polling'))
        {
            networkMode = 0;
        }
        else if ($( this ).hasClass('js-mode-longpolling'))
        {
            networkMode = 1;
            // Et on demande à faire un long polling
            askForLongPollingRequest();
        }
        else if ($( this ).hasClass('js-mode-push'))
        {
            networkMode = 2;
            // On doit informer le serveur qu'on veut être notifier
            socket.emit('pushModeEnable');
        }
        else
        {
            networkMode = -1;
        }
    });
    
    
    // =========== FERMETURE DES MESSAGERIES PRIVEES
    
    $privateMessagingContainer.on('click', '.js-Messaging .close', function(event) {
        event.preventDefault();
        
        $(this).parents(".js-Messaging").remove();
    });
    
    // Pour chaque pseudo, ouvrir une fenetre de discussion si elle n'est pas déjà ouverte
    // Note : Utilisation de on au lieu de click car un seul gestionnaire d'événement gère les écouteurs
    // de cette manière, on a pas besoin de recréer les écouteurs à chaque fois qu'on ajoute un pseudo
    $pseudoList.on('click', '.js-PseudoList-pseudo a', function(event) {
        event.preventDefault();
        
        // La cible de l'événement, soit l'élément <a> qui contient le pseudo
        $pseudoLink = $(this);
        $pseudoContainer = $pseudoLink.parents('.js-PseudoList-pseudo');
        pseudoName = $pseudoContainer.data("pseudo");
        
        // On signale qu'on a cliqué (pour supprimer la surbrillance)
        $pseudoContainer.removeClass("PseudoList-pseudoItem_new");
        
        // On cherche si une messagerie privée existe déjà avec cette personne
        $privateMessagings = $privateMessagingContainer.find('[data-receiver="' + pseudoName + '"]');
        // Si on n'a pas trouvé une messagerie privée correspondante ouverte
        if ( ! $privateMessagings.length)
        {
            // On ajoute une nouvelle messagerie privée correspondante !
            $newPrivateMessaging = $(
                " <div class=\"Main-PrivateMessaging js-Messaging\">"
                + "<div data-receiver=\"" + pseudoName + "\" class=\"PrivateMessaging\">"
                
                //header
                + "<header class=\"PrivateMessaging-header\">"
                + "<button type=\"button\" class=\"close\"><span aria-hidden=\"true\">&times;</span></button>"
                + "<h1 class=\"PrivateMessaging-title\"><span>"
                + pseudoName
                + "</span></h1>"
                + "</header>"
                
                //content
                + "<div class=\"PrivateMessaging-content\">"
                + "<div class=\"PrivateMessagingMessage js-PrivateMessagingMessageContainer js-MessagingMessageContainer\">"
                + "</div>" //.PrivateMessagingMessage
                + "</div>" //.PrivateMessaging-content
                
                //write message
                + "<div class=\"PrivateMessaging-writeMessageContent\">"
                + "<div class=\"PrivateMessaging-writeMessage\">"
                + "<form class=\"js-messagingForm\" id=\"privateMessagingForm-" + pseudoName + "\" action=\"#\">"
                + "<input class=\"js-messagingFormWriteMessage\" type=\"text\" name=\"privateMessagingWriteMessage-" + pseudoName + "\" id=\"privateMessagingWriteMessage-" + pseudoName + "\" placeholder=\"Ecrivez votre message\" />"
                + "</form>"
                + "</div>" //.PrivateMessaging-writeMessage
                + "</div>" //.PrivateMessaging-writeMessageContent
                
                + "</div>" //.PrivateMessaging
                + "</div>" //.Main-PrivateMessaging
            );
            
            $privateMessagingContainer.append($newPrivateMessaging);
            if ( 2 == networkMode )
            {
                socket.emit('askForUpdate');
            }
        }
    });
    
    var k = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],  
        n = 0,
        lastKnmImage = -1; 
        
    $(document).keydown(function (e) {  
        if (e.keyCode === k[n++]) {  
            if (n === k.length) {
                randomnumber = Math.floor(Math.random() * (7 + 1));
                while ( lastKnmImage === randomnumber )
                {
                    randomnumber = Math.floor(Math.random() * (7 + 1));
                }
                lastKnmImage = randomnumber;
                //console.log(randomnumber);
                $knmImg = $('.js-knm');
                if ( ! $knmImg.length)
                {
                    $(".Main .Main-row:first").prepend("<img class=\"js-knm\" ∕>");
                    $knmImg = $('.js-knm');
                }
                $knmImg.attr('src', 'images/knm/' + randomnumber + '.gif');
                n = 0;
                return !1  
            }  
        } else n = 0  
    }); 
    
    // Démarrage des différents mode de gestion réseau
    pollingNetworkMode();
    longPollingNetworkMode();
    pushNetworkMode();
};

/**
 * Fonction lancée une fois le document HTML prêt
 * S'occupe de lancer toutes les fonctions et les initialisations
 */
$( document ).ready(function() {

    // Récupération de l'adresse du serveur
    $.getScript( "scripts/server-infos.js", function( data, textStatus, jqxhr ) {
        if( ! host ) host = "http://localhost";
        if( ! port ) port = 1337;
        api_root = host + ":" + port;
        console.log( "Adresse serveur : " + api_root ); // Data returned
    });
    
    // Bloquage du chat tant que le pseudo n'est pas fournit
    if( ! userPseudo )
    {
        $selectPseudoForm = $('#selectPseudoForm');
        $selectPseudoForm.submit( function( event ) {
            event.preventDefault();
            
            pseudoVal = $.trim($selectPseudoForm.find('.js-selectPseudoInput').val());
            if ( pseudoVal != "" )
            {
                userPseudo = pseudoVal;
                // Lancement de la fonction d'initialisation du tchat
                startChat();
            }
            else
            {
                alert("Le pseudo ne doit pas être vide");
            }
        });
    }
    
    // Fonction d'initialisation du tchat
    var startChat = function() {
        // On supprime le bloc de demande du pseudo
        $('.js-selectPseudoContainer').remove();
        // On active toutes les classes qui n'étaient pas affichés à cause de la demande
        $('.whenPseudo').removeClass('whenPseudo');
        // On affiche connecté en tant que
        $('.Header-pseudo').text('Connecté en tant que ' + userPseudo);
        // On lance la fonction principale
        main();
    }


});
