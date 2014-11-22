
var scrollBottom = function( $block ) {
    $block.scrollTop($block.prop("scrollHeight"));
};

jQuery.fn.extend({
    scrollBottom: function() {
        this.scrollTop(this.prop("scrollHeight"));
}});


$( document ).ready(function() {

    // ======= CHAT BOX
    
    // Le <input> d'envoi de messages pour la Chatbox
    $chatBoxWriteMessage = $("#chatBoxWriteMessage");
    $chatBoxForm = $("#chatBoxForm");
    $chatBoxMessages = $("#chatBoxMessages");
    
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
                + "<div id=\"privateMessages-" + pseudoName + "\" class=\"PrivateMessagingMessage js-PrivateMessagingMessage\">"
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
        
            // La liste des messages de la chatbox
            chatBoxMessages = data.chatbox.messages;
            
            // On vide l'affichage des pseudos
            $chatBoxMessages.empty();
            
            // Pour chaque message
            $.each( chatBoxMessages, function( key, chatBoxMessage ) {
                //console.log(chatBoxMessage);
                $chatBoxMessages.append(
                    "<div class=\"ChatBoxMessage-message\">"
                    + "<div class=\"ChatBoxMessage-author\">"
                    + chatBoxMessage.author
                    + "</div>"
                    + "<div class=\"ChatBoxMessage-content\">"
                    + chatBoxMessage.content
                    + "</div></div>")
            });
            
        })
        .fail( function(data) {
            console.log("fichier non charge");
        });
    }, 2000);
    
});
