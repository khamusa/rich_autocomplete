/* This class will encapsulate an ObjectCollection and supply a default display interface for it, while
 * still allowing for the programmer to overwrite every display aspect through the options passed */
RA.debug = true;
(function() {
	var pluginName = "selectableContainer";

	// this refer to the private_methods object itself
	/* Ausiliary implementation methods */
	/* In all of them, this refer to the object itself */
	var implementation_methods = {
		// initialize data for the input, wich might be from the options object or infered from html dom objects
		initializeData: function($container, data) {
			$container.trigger(pluginName+".beforeInitializeData", [data]);

			var elements = []
			if(data.options.initialData == 'infer') 
				var elements = this.inferDataFromInputs($container, data);
			else if (data.options.initialData instanceof Array) 
				var elements = data.options.initialData;
			
			if(elements && elements instanceof Array)
				this.initializeFromElementsArray($container, elements, data);
			
			$container.trigger(pluginName+".afterInitializeData", [data]);
			return $container;
		},
		initializeFromElementsArray: function($this, elements, data) {	
			for(var i =0; i < elements.length; i++)
				$this[pluginName]('insert', elements[i]);
		},
		/* This method infer from the inner html input or select fields the elements to be initally added to our collection
		 * Oh, and it rocks! :D
		*/
		inferDataFromInputs: function(context, data) {
			function escapeRegExp(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); }
			var valuePropertyFormat = data.options.hiddenInputs.propertyFormat.replace("%s{property}", "value");
			var propertyNameDelimiters = valuePropertyFormat.split('value')
			if(propertyNameDelimiters[0])
						propertyNameDelimiters[0] = new RegExp("^"+escapeRegExp(propertyNameDelimiters[0]));
			if(propertyNameDelimiters[1])
						propertyNameDelimiters[1] = new RegExp(escapeRegExp(propertyNameDelimiters[1])+"$");

			var elements = [];		// the final array we will return
			var candidateValues = context.find('[name*="'+valuePropertyFormat+'"]').each(function() {
				var name = $(this).attr('name');
				var prefix = name.replace(valuePropertyFormat, "");
				var newObj = {};
				context.find('[name^="'+prefix+'"]').each(function() {
					var $this = $(this);
					var attrName = $this.attr('name').replace(prefix, "");
					if(propertyNameDelimiters[0]) attrName = attrName.replace(propertyNameDelimiters[0], "");
					if(propertyNameDelimiters[1]) attrName = attrName.replace(propertyNameDelimiters[1], "");
					if((attrName != data.options.deselectFlagName)&&(attrName != "meta")) // we don't want to read a _destroy attribute, for example
						newObj[attrName] = $this.val();					
				});
				elements.push(newObj); // pushes the object, doesn't matter if it is valid or not
			});
			return elements;
		},
		/*
		 * Renders hidden inputs for a selected element and attaches them to the rendered jquery-wrapped dom obj
		*/
		renderHiddenInputs: function(renderedItem, elementObject, data) {
			if(data.options.hiddenInputs.properties !== false) {
				var props = []
				if(data.options.hiddenInputs.properties === true) 
					props = Object.keys(elementObject);
				else if (data.options.hiddenInputs.properties instanceof Array) 
					props = data.options.hiddenInputs.properties;
				
				// todo: remove from props the key "_prefix"
				for(var i = 0; i < props.length; i++) {
					if(props[i] != "meta") {
						$('<input>', {
								type: 'hidden',
								value: elementObject[props[i]],
								name: elementObject.meta._prefix+data.options.hiddenInputs.propertyFormat.replace("%s{property}", props[i])
							})
							.appendTo(renderedItem);
					}
				}
			}
		},
		/* Responsible, specially, for the interpolation on inputs names */
		interpolatePrefix: function(prefix, elementObject) {
			if(!elementObject.meta._random)
				elementObject.meta._random = Math.random().toString().slice(2);

			var reg = /%s\{([^\{\}]+)\}/;
			var to_interpol;
			
			while((to_interpol = reg.exec(prefix)) !== null) {
				var possibilities = to_interpol[1].split('|');
				var result = false;
				for(var x = 0; x < possibilities.length; x++) {
					// we try for a property on elementObject
					if(elementObject.hasOwnProperty(possibilities[x]))
						result = elementObject[possibilities[x]];
					else if(possibilities[x] == "random")
						result = elementObject.meta._random;
					// if we still can't, we use literally, but ONLY if we're in the last possibility
					else if(x >= (possibilities.length-1))
						result = possibilities[x];

					if(result)
						break;
				}
				// we interpolate the result into prefix
				prefix = prefix.replace(to_interpol[0], result);
			} // while
			return prefix
		},
		implementDeselect: function (deselect, elementObject, data) {
			if(data.options.deselect == "flag")
				deselect.append('<input type="hidden" name="'+elementObject.meta._prefix+data.options.hiddenInputs.propertyFormat.replace("%s{property}", data.options.deselectFlagName)+'" value="0">')

			deselect.click(function() {
						// calls the collection removeElement method
						$(this).closest('.'+data.options.display.containerClass)[pluginName]('removeElement', elementObject);
					});	
		}
	}

	/* "Private Methods */
	var overwritable_methods = {
		/* Overwritable Rendering Methods */	
		/* In all those methods, this references the cointaner element upon which the plugin has been called */
		/* $domObjToAppend is the result of the method renderItem, a jquery-wrapped dom element */
		/* elementObject is the native js object that was inserted into the collection */
		appendItem: function($domObjToAppend, elementObject, data) {
			$domObjToAppend.appendTo(data.innerContainer);
			return $domObjToAppend;
		},
		/* elementObject is the native js object that was inserted into the collection */
		renderItem: function(elementObject, data) {
			var renderedItem = $(data.options.display.singleItem);
			data.options.display.renderItemTitle.apply(this, [renderedItem, elementObject, data]);
			return renderedItem;
		},
		/* Must render AND append the item title to the supplied renderedItem */
		renderItemTitle: function(renderedItem, elementObject, data) {
			return $(data.options.display.title).text(elementObject.label).appendTo(renderedItem);
		},
		/* Will render, attach event AND append the "close"/"deselect" icon to the supplied renderedItem 
		 * Returns the jquery-wrapped dom element
		*/
		renderDeselectLink: function(renderedItem, elementObject, data) {
			var deselect = $(data.options.display.deselectLink).appendTo(renderedItem);
			return deselect;
		}
	}

	var default_options = {
		/* Configuration options */
		unique: true,				// indicates if there can be duplicated selected elements (same value), this parameter is handled by ra.object_collection										
	 	deselect: 'flag',			// possible options: flag, remove, false
	 	deselectFlagName: '_destroy',
	 	initialData: 'infer',		// available options: 'infer', array of elements object [ { label: x, value: y } [, ... {}] ] or false
	 	hiddenInputs: {				// specifies options for the hidden inputs we want to insert along selected elements
	 		// namePrefix
	 		// You may interpolate elements properties or random strings in the hidden inputs names
	 		// To do that, you must supply the interpolation indicators in the format %s{identifier1|identifier2|[ ... identifierN]}
	 		// Where identifier1...IdentifierN is one of:
	 		// 		An element property, like value, label, or any other property your elements have
	 		// 		The string "random", in which case a random numeric string will be inserted
	 		// 		A literal character, if it's the last supplied identifier and none of the above got satisfied.
	 		//			This allow for setting alternatives for a non-existent property
	 		//
	 		// The first identifier that matches one of the above cases 
	 		// Note, when using random, all hidden inputs for the same selected element will share the same random string, which
	 		// will, then, allow you to identify each selected element (in case you're working with multiple selects)
 			// Example:
 			// 	"selected_items[%s{random}][%s{myCustomId|Foo}]"
 				
 			// 	- the %s{random} statement will be replaced by a random numeric string like "457567654654"
 			// 	- The second placeholder %s{myCustomId|Foo} will be replaced by:
 			// 		- the element's myCustomId property, if it exists
 			// 		- Foo if the element does not have a myCustomId property
	 		namePrefix: 'selected_item[%s{random}]',
	 		// The properties property specifies which properties of the rendered JS element will be embedded in the html as hidden fields:
	 		//	true means every property defined in the selected element will be included
	 		//	false means no property getting included (useful if you want to manage it by yourself)
	 		//	["prop1", [ ... ]] - an array of properties names
	 		properties: true,
	 		propertyFormat: '[%s{property}]'
	 	},
	 	display: {					// display configuration
	 		elementClass: 'selected_element',												 	
	 		containerClass: 'selectable_container',								// the class to be applied to the container upon initialization
 		
 			innerContainer: '<div class="inner_selectable_container"></div>',	// the inner container which will contain the rendered items
 			singleItem: '<div class="single_item"></div>',						// the element used to render each item
 			title: '<span class="single_item_title"></div>',
 			deselectLink: '<span class="single_item_deselect">&times;</span>',		// html to build the "close link" which deselects an element

 			/* Overwritable Rendering Methods */	
			/* In all those methods, this references the cointaner element upon which the plugin has been called */
			appendItem: overwritable_methods.appendItem,
			renderItem: overwritable_methods.renderItem,
			renderItemTitle: overwritable_methods.renderItemTitle
			}		
	}

	var methods = {
		init: function(opts) {
			var options = $.extend(true, {}, default_options, opts);

			return this.each(function(){ 
				var $container = $(this);

				var data = $container.data(pluginName);
				// Initialize the plugin if the plugin hasn't been initialized yet
				if ( ! data ) {
					data = { options: options }
					data.collection = new RA.ObjectCollection({ unique: options.unique });
					data.innerContainer = $(data.options.display.innerContainer);

					$container
			 			.addClass(options.display.containerClass)
			 			.data(pluginName, data);			// re-saves data

			 		// initialize elements, remove any content from inside and after that append the container
			 		implementation_methods.initializeData($container, data);
			 		$container.html('').append(data.innerContainer);				
				}
			});

		},
		/* Inserts an element into the collection, while also 
		 * triggering the applyable events;
		*/
		insert: function(elementObject) {
			var data = this.data(pluginName);
			this.trigger(pluginName+".beforeInsert", [elementObject, data]);

			// insert the elementObject
			var success = data.collection.insert(elementObject);
			if(success) {
				// render and append the object
				if(!elementObject.meta) elementObject.meta = {};
				elementObject.meta._prefix = implementation_methods.interpolatePrefix(data.options.hiddenInputs.namePrefix, elementObject);
				
				this.trigger(pluginName+".beforeRenderItem", [elementObject, data]);
					var appendedDomObject = data.options.display.renderItem.apply(this, [elementObject, data]);
				this.trigger(pluginName+".afterRenderItem", [appendedDomObject, elementObject, data]);
				implementation_methods.renderHiddenInputs(appendedDomObject, elementObject, data);
				
				if(data.options.deselect) {
					var deselect = overwritable_methods.renderDeselectLink.apply(this, [appendedDomObject, elementObject, data]);		
					implementation_methods.implementDeselect(deselect, elementObject, data);
				}	

				elementObject.meta._renderedItem = appendedDomObject;
				this.trigger(pluginName+".beforeAppendItem", [appendedDomObject, elementObject, data]);
					data.options.display.appendItem.apply(this, [appendedDomObject, elementObject, data]);
				this.trigger(pluginName+".afterAppendItem", [appendedDomObject, elementObject, data]);
				// event callback
				this.trigger(pluginName+".afterInsert", [elementObject, appendedDomObject, data]);
			} 
			return this;			
		},
		/* Removes the first element that can be found using the specified identifier */
		remove: function(identifier) {
			var data = this.data(pluginName);
			var index = data.collection.index(identifier);
			var elementObject = data.collection.at(index);

			if(elementObject)
				this[pluginName]('removeElement', elementObject);

			return this;
		},
		/* Remove the exact element passed as a parameter. This method uses the common equality test between elements to find the target one */
		removeElement: function(elementObject) {
			var data = this.data(pluginName);
			var index = data.collection.elementIndex(elementObject);
			this.trigger(pluginName+".beforeRemove", [elementObject, index, data]);

			if(index !== null) {
				var renderedItem = elementObject.meta._renderedItem;

				if(data.options.deselect == "remove")
					renderedItem.remove();
				else if(data.options.deselect == "flag") {
					renderedItem.hide().find('[name*="'+data.options.deselectFlagName+'"]').val(1);
				}
				data.collection.removeAt(index);
			}

			this.trigger(pluginName+".afterRemove", [elementObject, index, data]);
			return this;
		},
		contains: function(identifier) { 
			var data = this.data(pluginName);
			var index = data.collection.index(identifier);
			return index !== null;
		},
		getValues: function() { var data = this.data(pluginName); return data.collection.getValues(); },
		getLabels: function() { var data = this.data(pluginName); return data.collection.getLabels(); },
		getPairs: function() { var data = this.data(pluginName); return data.collection.getPairs(); }
	} // var methods
	
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