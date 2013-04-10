// @author Samuel Gomes Brandão (gb.samuel@gmail.com)
// 2013 - No license, use as you wish, just keep the credits in the code.


(function( $ ){
	var pluginName = "richAutocomplete";
	var selectableContainerName = "selectableContainer";

	var implementation_methods = {}
	var overwritable_methods = {
			/* Responsible for animating in a recently inserted object */
			animateIn: function (renderedItem) {
				renderedItem.hide().slideDown('fast');
			},
			/* Responsible for animating in a recently inserted object */
			animateOut: function (renderedItem, callback) { // vamos manter o callback?
				renderedItem.slideUp('fast');
			}
	}

	var default_options = {
		// behaviour like options
 	 	minLength: 2,						// jquery-ui parameter, how many characters does the user has to type before receiving suggestions?
 	 	multiple: true,						// type = single or multiple? Allows user to select many objects, or just one?
 	 	// future: additionalInput: null,				// format: { input: "<input>", params: {}},
 	 	source: [],							// source for the autocomplete
 	 	// display-like options
 	 	display: {
 	 		placeholderText: "Procurar ...", // straight-forward
 	 		wrappingContainer: "<div class='rich_autocomplete_wrapper'></div>",
 	 		searchInput: "<input class='ra_autocomplete_input' type='text'>",
 	 		animation: {
				elementIn: overwritable_methods.animateIn,		
				elementOut: overwritable_methods.animateOut,
				inputIn: overwritable_methods.animateIn,		
				inputOut: overwritable_methods.animateOut				
			}
 	 	}
 	 }; // end default_options



var methods = {
	 init : function( opts ) {
	 		var options = $.extend(true, {}, default_options, opts);

			return this.each(function(){ 
				var $container = $(this);

				// we assume richAutocomplete is called in the SelectableCollection container element
				var data = $container.data(pluginName);
				// Initialize the plugin if the plugin hasn't been initialized yet
				if ( ! data ) {
					data = { options: options }
					
					if(!options.multiple) options.limitElements = 1;
					$container[selectableContainerName](options);	

					var $wrapper = $(options.display.wrappingContainer);
					var $searchInput = $(options.display.searchInput)
							.attr('placeholder', data.options.display.placeholderText);

					$container
						.wrap($wrapper)
						.parent().append($searchInput);
					
					$searchInput.autocomplete({
						autoFocus: true,
						minLength: options.minLength,
						source: options.source,					
							focus: function(event, ui) { event.preventDefault() }, // do nothing
							select: function( event, ui ) {
								$container[pluginName]('select', ui.item);
								return false;
							}
						});
					// data.wrapper.
					// initialize the jquery-ui plugin that will be hooked into our customization
					/*
					/*.data('uiAutocomplete')._renderItem = function( ul, item ) {
						var $a = $( "<a>" ).text( item.label );
						if(item.desc && item.desc != "") {
							$a.append( $('<span class="ra-menu-desc"></span>').html(item.desc) );
						}
						return $( "<li>" ).append( $a ).appendTo(ul);
					};	*/			
				 	
				 	$container.data(pluginName, data);
			 		$container.trigger(pluginName+'.afterInitialize', [data]);
		 		} // data
			}); // each
	 }, // init
	 // selects an element
	 // parameter to_select = { id: 2, label: "Maria José", desc: "Additional description" }
	 select : function( to_select ) {
		var data = this.data(pluginName);
		this.trigger(pluginName+'.beforeInsert', [data, to_select]);
		
		this[selectableContainerName]('insert', to_select);

		if(!data.options.multiple) {
			// TODO hide o parent... this.parent().find('.ra_autocomplete_input').hide();
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

