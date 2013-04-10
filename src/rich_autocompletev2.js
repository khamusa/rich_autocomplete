// @author Samuel Gomes Brandão (gb.samuel@gmail.com)
// 2013 - No license, use as you wish, just keep the credits in the code.


(function( $ ){
		var pluginName = "richAutocomplete";
		var selectableContainerName = "selectableContainer";
		var default_options = {
	 	 	minLength: 2,						// jquery-ui parameter, how many characters does the user has to type before receiving suggestions?
	 	 	multiple: true,						// type = single or multiple? Allows user to select many objects, or just one?
	 	 	displaySelectedDescription: true, 	// shall we display the selected item's description?
	 	 	additionalInput: null,				// format: { input: "<input>", params: {}},
	 	 	placeholderText: "Comece a digitar...", // straight-forward
	 	 	source: [],							// source for the autocomplete
	 	 	selectableContainer: {}
	 	 }; // end default_options


var methods = {
	 init : function( options ) {
	 		var options = $.extend(true, {}, default_options, opts);

			return this.each(function(){ 
				var $container = $(this);

				var data = $container.data(pluginName);
				// Initialize the plugin if the plugin hasn't been initialized yet
				if ( ! data ) {
					data = { options: options }
					$container.selectableContainer(options.selectableContainer);		
					
					// initialize the jquery-ui plugin that will be hooked into our customization
					$inputField.autocomplete({
						autoFocus: true,
						minLength: options.minLength,
						source: options.source,
					
						focus: function(event, ui) { event.preventDefault() }, // do nothing
						select: function( event, ui ) {
							$this[pluginName]('select', ui.item);
							return false;
						}
						}); // autocomplete
						/*.data('uiAutocomplete')._renderItem = function( ul, item ) {
							var $a = $( "<a>" ).text( item.label );
							if(item.desc && item.desc != "") {
								$a.append( $('<span class="ra-menu-desc"></span>').html(item.desc) );
							}
							return $( "<li>" ).append( $a ).appendTo(ul);
						};	*/			
				 	
			 		$this.trigger(pluginName+'.afterInitialize', [data]);
		 		} // data
			});
	 }, 
	 // selects an element
	 // parameter to_select = { id: 2, label: "Maria José", desc: "Additional description" }
	 select : function( to_select ) {
		var data = this.data(pluginName);
		this.trigger(pluginName+'.beforeInsert', [data, to_select]);
		
		if(data.options.multiple) {
			// adiciono o novo item, a uniqueness será gerida pelo selectableContainer
		} else {
			// removo qualquer elemento anteriormente adicionado
		
			// adiciono o novo item
 			// escondo as coisas necessárias e mostro as outras			
		}
			
		this.trigger(pluginName+'.afterInsert', [data, to_select]);
		this.data(pluginName, data);
		return this;
	 }
};

$.fn[pluginName] = function( method ) {
	if ( methods[method] ) {
		return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
		return methods.init.apply( this, arguments );
	} else {
		$.error( 'O método ' +method + ' não existem no plugin $.'+pluginName );
	}
};
})( jQuery );

