
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
        console.log( "Handler for .submit() called." );
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
                console.log(pseudo);
                $pseudoList.append(
                    "<li class=\"PseudoList-pseudoItem\">"
                    + "<a class=\"PseudoList-pseudo\" href=\"#\">"
                    + pseudo
                    + "</a></li>");
            });
            
        })
        .fail( function(data) {
            console.log("fichier non charge");
        });
    }, 5000);
});
