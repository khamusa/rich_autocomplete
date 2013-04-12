// @author Samuel Gomes Brandão (gb.samuel@gmail.com)
// 2013 - license: use as you wish, just keep the credits in the code.


(function( $ ){
	var pluginName = "richAutocomplete";
	var selectableContainerName = "selectableContainer";

	var implementation_methods = {
		handleAfterRemoveCallback: function (evt, elementObject, index, innerContainerData) {
			var $container = $(this);
			var data = $container.data(pluginName);
			var $searchInput = $container.parent().find('.'+data.options.display.searchInputClass);

			if(data.options.display.hideInput && !$container[selectableContainerName]('isFull') && $searchInput.is(':hidden'))
				if(data.options.display.animation && data.options.display.animation.inputIn && innerContainerData.initialized)
					data.options.display.animation.inputIn($searchInput);
				else
					$searchInput.show();
				
		},
		handleAfterInsertCallback: function(evt, elementObject, appendedDomObject, innerContainerData) {
			var $container = $(this);
			var data = $container.data(pluginName);
			var $searchInput = $container.parent().find('.'+data.options.display.searchInputClass);

			if(data.options.display.hideInput && $container[selectableContainerName]('isFull'))
				if(data.options.display.animation && data.options.display.animation.inputOut && innerContainerData.initialized)
					data.options.display.animation.inputOut($searchInput);
				else
					$searchInput.hide();
		}
	}

	var overwritable_methods = {
			/* Responsible for animating in a recently inserted object */
			animateIn: function (renderedItem) {
				renderedItem.hide().slideDown('fast', 'linear');
			},
			/* Responsible for animating in a recently inserted object */
			animateOut: function (renderedItem, callback) { // vamos manter o callback?
				renderedItem.slideUp('fast', 'linear');
			},
			inputIn: function (renderedItem) {
				renderedItem.hide().slideDown({ 
					duration: 'fast',
					easing: 'linear',
					// Chrome after slidingDown an input does not allow insertion of text. We simulate a zooming so that we force it to re-render
					complete: function() { 
						var $this = $(this);
						if($this.css('zoom') == 1)
							$this.css('zoom', 0.9999); 
						else
							$this.css('zoom', 1); 
					} // bug fixing
				});
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
 	 		wrappingContainer: "<div class='rich-autocomplete-wrapper'></div>",
 	 		searchInput: "<input type='text'>",
 	 		searchInputClass: 'ra-autocomplete-input',
 	 		hideInput: true,								// hides the search input if we've reached minLength or multiple = false
 	 		animation: {
				elementIn: overwritable_methods.animateIn,		
				elementOut: overwritable_methods.animateOut,
				inputIn: overwritable_methods.inputIn,		
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
					$container.data(pluginName, data);

					$container.bind(selectableContainerName+".afterRemove", implementation_methods.handleAfterRemoveCallback);
					$container.bind(selectableContainerName+".afterInsert", implementation_methods.handleAfterInsertCallback);

					var $wrapper = $(options.display.wrappingContainer);
					var $searchInput = $(options.display.searchInput)
							.addClass(options.display.searchInputClass)
							.attr('placeholder', data.options.display.placeholderText);

					$container
						.wrap($wrapper)
						.parent().append($searchInput);

					if(!options.multiple) options.limitElements = 1;
					$container[selectableContainerName](options);	

					$searchInput.autocomplete({
						autoFocus: true,
						minLength: options.minLength,
						source: options.source,					
							focus: function(event, ui) { event.preventDefault() }, // do nothing
							select: function( event, ui ) {
								$container[pluginName]('select', ui.item);
								$searchInput.val('') // resets the search
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

