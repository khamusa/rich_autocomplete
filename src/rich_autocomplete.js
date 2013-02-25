
/* CRIA UM AUTOCOMPLETE MAIS ELABORADO, QUE EXIBE NÃO SÓ UMA LINHA DE TEXTO MAS TAMBÉM UMA SEGUNDA */

/* NO CAMPO data-ra-source deve haver a url para requisição das opções do autocomplete 
* Deve-ser retornar um array de itens da seguinte forma:
* [{id: 1, label: "Maria José", desc: "Cpf 076.735.566-22" }, ... ]
* 
* Tanto o id quanto o campo desc são opcionais
* Se não for informado um id, o autocomplete usará o campo label
* 
* No html deve haver três campos. O que será enviado para o servidor será o campo com a classe .ra-autocomplete-input
* O campo desc é preenchido com a descrição do item que tiver sido selecionado
* */


// returns a copy of the array passed as parameter without duplicates
// the second parameter is a function which returns true when two objects of the array are equal
$.extend({
	distinct : function(anArray, areEqual) {
		 if(!areEqual) {
		 	areEqual = function(v1, v2) { return v1 == v2; };
		 }
		 var result = [];
		 for(index in anArray) {
		 	var valid = true;
		 	for(var i = 1*index + 1; i < anArray.length; i++) {
		 		if(areEqual(anArray[i], anArray[index])) {
		 			valid = false; 
		 			break;
		 		}
		 	}
		 	if(valid) 
		 		result.push(anArray[index]);	
		 }
		 return result;
	}
});


(function( $ ){

var methods = {
	 init : function( options ) {
	 	var default_options = {
	 	 	minLength: 2,	// jquery-ui parameter, how many characters does the user has to type before receiving suggestions?
	 	 	multiple: false,	// type = single or multiple? Allows user to select many objects, or just one?
	 	 	
	 	 	placeholderText: "Comece a digitar...", // straight-forward
	 	 	deselectLink: "<a class='close'>X</a>", // just the html, so you may customize it

	 	 	// only for type = multiple
	 	 	multiple_unique: true,		// if set to false the autocomplete will accept duplicate values selected
	 	 	valuePassing: "json"	
	 	 		// json or array = If set to json, the selected object will be passed as a json string, otherwise the input field will be duplicated so that the selected values will be passed as an array	
	 	 }; // end default_options
	 	 
	 	 options = $.extend(default_options, options);
		 return this.each(function(){ 
			 var $this = $(this),
			 data = $this.data('richAutocomplete');
			 
			 // Initialize the plugin if the plugin hasn't been initialized yet
			 if ( ! data ) {
			 	var options_current = $.extend({}, options, {
			 		minLength: $this.attr('data-ra-min-length'),
			 		placeholderText: $this.attr('data-ra-placeholder'),
			 		source: (($this.attr('data-ra-source') != null) && ($this.attr('data-ra-source') != "")) ? $this.attr('data-ra-source') : undefined,
			 		multiple: $this.attr('data-ra-multiple'),
			 		multiple_unique: $this.attr('data-ra-multiple-unique') != "false"
			 	});
			 	
			 	// campos comuns para todos tipos de inputs
			 	$this.hide();
			 	var $inputField = $('<input autocomplete="off">', { 
							 			"class" : "ra-autocomplete-input",
							 			"type": "text"
							 		})
							 		.hide()
							 		.insertAfter($this);
				 		
			 	var $displayWrapper = $('<div>', { 
						 				"class": "ra-display"
						 			})
						 			.hide();
			 	
			 	// initialize some options according to autocomplete type
			 	if (options_current.multiple) {
			 		$displayWrapper
			 			.addClass('ra-multiple-display')
			 			.insertBefore($inputField);
			 	} else {
			 		$displayWrapper
			 			.addClass('ra-single-display')			 		
			 			.click(function() { // attach do evento que esconde o display e exibe novamente o input
							$displayWrapper.hide();
							$inputField.show().focus();
						})
						.insertAfter($inputField);
			 	} 
			 	
			 	// remove o placeholder quando o inputField ganha foco
				$inputField
					.focus(function() {
						if($inputField.val() == options_current.placeholderText) {
							$inputField.val('');
						}
					})
					// quando o campo perde foco, o que fazer?
					.blur(function() {
						if(!options_current.multiple) {
							if($this.val() != "") {
								$inputField.hide();
								$displayWrapper.show();
							}
						}
						if (($inputField.val() == '')||(options_current.multiple)) {
							$inputField.val(options_current.placeholderText);
						}
						
					})
					// Evita que o formulário seja enviado se o usuário apertar enter neste campo.
					.keypress(function(event){
						if (event.keyCode == 10 || event.keyCode == 13) 
						event.preventDefault();
					})
					.show();
				
				// retrieves the initial selected values	
				try {
					var $selected = JSON.parse($this.attr('data-ra-selected'));
					if($selected == "")
						$selected = null;
				} catch(e) {
					var $selected = null;
				}
				
				// saves data
				$this.data('richAutocomplete', {
					 selected: $selected,
					 idField: $this,
					 inputField: $inputField,
					 displayWrapper: $displayWrapper,
					 options: options_current,
					 _renderSelectedItem: function(data, to_select) {
			 	 		var $this = this;
			 	 		var to_add = $("<div class='ra-selected-item'></div>")
			 	 			.hide()
			 	 			.attr('data-ra-selected-value', to_select.value)
							.append($("<span class='ra-selected-label'></span>")
							.html(to_select.label));
						
						// close link
						if(data.options.deselectLink) {
							var $deselect = $(data.options.deselectLink)
								.appendTo(to_add)
								.click(function() {
			 						$this.richAutocomplete('deselect', to_select);
			 					});
						}
						return to_add;			
			 	 	}
				 });
			
				// initialize the jquery-ui plugin that will be hooked int our customization
				$inputField.autocomplete({
					autoFocus: true,
					minLength: options_current.minLength,
					source: options_current.source,
				
					select: function( event, ui ) {
						$this.richAutocomplete('select', ui.item);
						return false;
					}
					}).data('uiAutocomplete')._renderItem = function( ul, item ) {
						var $a = $( "<a>" ).text( item.label );
						if(item.desc && item.desc != "") {
							$a.append( $('<span class="ra-menu-desc"></span>').html(item.desc) );
						}
						return $( "<li>" ).append( $a ).appendTo(ul);
					};				
			 	
			 		$this.richAutocomplete('_initializeSelected');
			 } // IF (!data)
		 }); // this.each
	 }, // function init
	 _initializeSelected : function () {
	 	var data = this.data('richAutocomplete');
	 	//initialize the selected values
		if(data.selected) {
	 		data.idField.val('');
	 		data.displayWrapper.html('');
		 	
		 	if(data.options.multiple) {
		 			var length = data.selected.length;
		 			var objects = data.selected;
					data.selected = [];
		 			for(var i = 0; i < length; i++){
			 			this.richAutocomplete('select', objects[i]);
		 			}
		 	} else {
		 		this.richAutocomplete('select',  data.selected);
		 	}
	 	}	
	 },
	 // selects an element
	 // parameter to_select = { id: 2, label: "Maria José", desc: "Additional description" }
	 select : function( to_select ) {
		var data = this.data('richAutocomplete');
		this.trigger('ra.beforeSelect', [data, to_select]);
		
		if(!data.options.multiple) {
			// removo qualquer elemento anteriormente adicionado
			data.displayWrapper.html(''); 
			
			// gero o novo item a ser exibido e o adiciono
			var to_add = data._renderSelectedItem.apply(this, [data, to_select])
				.addClass('ra-single-selected-item');
 				
 			// escondo as coisas necessárias e mostro as outras
			data.inputField
				.val(to_select.label)
				.slideUp('fast');
			data.displayWrapper.slideDown('fast');
			
			// salvo a informação de qual item foi selecionado
			data.idField.val(to_select.value);
			data.selected = to_select;
		} else {
			data.inputField.val('');
			// salvo as informações nos dados do plugin
 	 		if(!data.selected)
 	 			data.selected = [];
 	 		data.selected.push(to_select);
			
			// verifico duplicados, se for necessário pela configuração 	 		
 	 		var old_length = data.selected.length; 	 		
 	 		if(data.options.multiple_unique)
 	 			data.selected = $.distinct(data.selected, function(v1,v2) { return v1.value == v2.value; });
 	 		
 	 		// após remover as duplicadas, o array foi alterado? se foi alterado quer dizer que não há nada a adicionar!
 	 		if(data.selected.length == old_length) {
				data.displayWrapper.show();
 				// here
 				var to_add = data._renderSelectedItem.apply(this, [data, to_select])
 					.addClass('ra-multiple-selected-item');
 	 		} 
	 	 		
			// ponho os valores no campo, em formato JSON
 			data.idField.val(JSON.stringify(data.selected));
		}
		
		to_add.appendTo(data.displayWrapper)
			.slideDown('fast');
			
		this.trigger('ra.afterSelect', [data, to_select]);
		this.data('richAutocomplete', data);
		return this;
	 },
	 // removes any deselection from the input
	 deselect : function (to_select) {
		var data = this.data('richAutocomplete');
		this.trigger('ra.beforeDeselect', [data, to_select]);
		
		if(!data.options.multiple) { // type = multiple?
			data.inputField.val('');
			data.idField.val('');
			
			// deselecionei, re-exibo o campo de input para o usuário
			data.inputField.slideDown('fast').focus();
			data.displayWrapper.slideUp('fast').html('');
	 		data.selected = null;
	 		
		} else { // type = single?
			// hide the displayed item
			data.displayWrapper.find('[data-ra-selected-value="'+to_select.value+'"]').slideUp('fast');
			var i = data.selected.indexOf(to_select);
			data.selected.splice(i, 1);
			
			// atualizo o campo
 	 		data.idField.val(JSON.stringify(data.selected));
			if(data.selected.length == 0)
				data.displayWrapper.slideUp('fast');
		}
		
		this.trigger('ra.afterDeselect', [data, to_select]);
		this.data('richAutocomplete', data);
		return this;
	 },
	 selectedValue: function() {
		var data = this.data('richAutocomplete');
		if(!data.options.multiple) {
	 		if(data.selected)
	 			return data.selected.value;
			else
				return null;
		} else {
			console.error("The method selectedValue does not apply to multiple selects, use selectedValues instead");
		}
	 },
	 selectedLabel: function() {
		var data = this.data('richAutocomplete');
		if(!data.options.multiple) {
	 		if(data.selected)
	 			return data.selected.label;
			else
				return null;
		} else {
			console.error("The method selectedLabel does not apply to multiple selects, use selectedLabels instead");
		}
	 },
	 is_selected: function () { 
		var data = this.data('richAutocomplete');
		if(!data.options.multiple) {
	 		if(data.selected)
	 			return true;
			else
				return false;
		} else {
			console.error("The method is_selected does not apply to multiple selects, use selected_count instead");
		}
	 },
	 // TODO métodos auxiliares para multiple selects
	 selectedValues: function() {
		var data = this.data('richAutocomplete');
		if(data.options.multiple) {
	 		r = [];
	 		for(var i in data.selected) {
	 			r.push(data.selected[i].value);
	 		}
	 		return r;
		} else {
			console.error("The method selectedValues does not apply to single selects, use selectedValue instead");
		}
	 },
	 destroy : function( ) {
	 	return this.each(function(){
		// TODO
	 	})
	 }
};

$.fn.richAutocomplete = function( method ) {
	if ( methods[method] ) {
		return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
		return methods.init.apply( this, arguments );
	} else {
		$.error( 'O método ' +method + ' não existem no plugin $.richAutocomplete' );
	}
};
})( jQuery );

$("input.ra-input").richAutocomplete({ 
	source: [{ label: "Maria Joana", value: 1, desc: "Pessoa muito interessante"},
		{ label: "Marta Pereira", value: 2, desc: "Pessoa muito interessante"},
		{ label: "Ricardo Pereira", value: 4, desc: "Pessoa muito interessante"},
		{ label: "Samara Felippo", value: 5, desc: "Pessoa muito interessante"},
		{ label: "Stella Artois", value: 6, desc: "Pessoa muito interessante"},
		{ label: "Cibele Gomes", value: 7, desc: "Pessoa muito interessante"},
		{ label: "Maria Mônica", value: 8, desc: "Pessoa muito interessante"}
	]
	});

$("input.ra-input").bind('ra.beforeSelect', function(evt, data, object) { });
