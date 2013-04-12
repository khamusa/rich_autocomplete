if(typeof RA == "undefined")
	RA = {}

/* Auxiliary array function, which allow to test for the presence of an arbitrary object structure inside an array */
Array.prototype.findElement = function(element, tester) {
	if(!tester)
		tester = function(el1, el2) { return el1 == el2 }
	var found = null;
	var i = 0;
	for (i; i < this.length; i++) {
		if(tester(this[i], element)) {
			found = i;
			break;
		}
	}
	return found;
};



RA.ObjectCollection = function(opts) {
		var options = $.extend({}, {
			unique: false
		}, opts);

		var me = this;
		var collection = [];
		/* publicly accessible properties */
		this.length = 0;

		/* "Private" implementation methods */ 
		
		/* Auxiliary function, returns true if the argument object is a valid elementary object */
		// valid means it is an object, has a value and label properties
		var valid_object = function(identifier) { 
			return ((typeof identifier == "object") && (identifier.hasOwnProperty("value")) && (identifier.hasOwnProperty("label"))); 
		};
		
		/* Groups the methods used to supply the index functionality */
		var index_methods = {
			index_elementary: function(elementary) { 
				return collection.findElement(elementary, function(el1, el2) { return el1.value == el2.value }); 
			},
			index_by_value: function(value) { return collection.findElement(value, function(arrayElement, myElement) { return arrayElement.value == myElement }); },
			index_by_element: function(value) { return collection.findElement(value, function(arrayElement, myElement) { return arrayElement == myElement }); },
			index: function(identifier) {
				if(me.validObject(identifier))
					return this.index_elementary(identifier);
				else
					return this.index_by_value(identifier);
			}
		};

		/* Implements the insert method */
		var insert_method = function(elementary) {
			// the element gets added if this is not a unique objects collection OR if the element does not exist yet
			if(!me.validObject(elementary))
				return false;

			if(!options.unique || (me.index(elementary) == null)) {
				collection.push(elementary);
				me.length += 1;
				return true
			}
			return false;
		}

		var remove_methods = {
			remove: function(identifier) {
				var index = me.index(identifier);
				if(index == null)
					return false;
				return this.removeAt(index);
			},
			removeAt: function(index) { 
				if(index >= me.length)
					return false;
				collection.splice(index, 1); 
				me.length -= 1;
				return true;
			}
		}

		/* This function re-inserts every element, granting the unique constraint and resetting the length property */
		/* Returns the new length */
		var collection_reload = function() {
			var c2 = collection.concat([]); // saves a copy of the collection
			me.clear(); // remove objects from the list
			for (var i in c2) me.insert(c2[i]);
			return me.length;
		}

		/* Public functions */

		/* Manipulation functions */
		/* Accepts an elementary object or a string as parameter 
		 * if identifier is an elementary object (i.e an object with label and value properties defined):
		 *		Returns the index of the element found with value equal to the passed object's value 
		 * if identifier is a string or number or any other kind of element
		 * 		Returns the position of the element who's value equals the passed identifier
		*/
		this.index = function(identifier) { return index_methods.index(identifier); };
		/* Finds an element by the element itself, using the common equality operator */
		this.elementIndex = function(identifier) { return index_methods.index_by_element(identifier); }
		
		/* Inserts the supplied element into our collection 
		 * Note: 
		 * 	A) It will not insert if it's not a valid object
		 *  B) It won't insert duplicates if the object's unique property is set to true
		*/
		this.insert = function(elementary) { return insert_method(elementary); };

		/* Removes the element identified by the argument's value, or logically equal to the supplied elementary element */
		this.remove = function(identifier) { return remove_methods.remove(identifier) };

		/* Removes the element at a specified position */
		this.removeAt = function(number) { return remove_methods.removeAt(number) };

		/* Removes all the elements that match the identifier logic equality */
		this.removeAll = function(identifier) {
			var initialLength = this.length;
			while(this.remove(identifier)); // removes as long as it goes
			return initialLength != this.length; // true if the length has changed
		};

		/* clears the collection */
		this.clear = function() { this.length = 0; collection = []; };

		/* Read/set an option */
		this.options = function(key, value) { 
			if (value) {
				options[key] = value;
				if(key == "unique")
					collection_reload();

				return value;
			} else
				return options[key];
		};

		/* Data Reading Methods */
		/* Returns the raw collection, violates encapsulation but we assume the programmer knows what he's doing */
		this.collection = function() { return collection; };

		/* Returns a list of the select values only */
		this.getValues = function() {
			var r = [];
	 		for(var i = 0; i < me.length; i++) r.push(collection[i].value);
	 		return r;
		};

		/* Returns a list of the selected labels only */
		this.getLabels = function() {
			var r = [];
	 		for(var i = 0; i < me.length; i++) r.push(collection[i].label);
	 		return r;
		};

		/* Returns an object who's keys are the values of the inserted elements, 
		 * and the associated values are the elements values */
		this.getPairs = function() {
			var obj = {};
			for (var i = 0; i < me.length; i++) {
				obj[collection[i].value] = collection[i].label;
			};
			return obj;
		}

		/* Returns the first item */
		this.first = function() { return me.at(0); };

		/* Returns the last item */
		this.last = function() { return me.at(me.length-1); };

		/* Returns the object in the specified position */
		/* If the index is out of range, return false */
		this.at = function(index) { return ((index < me.length) && (index >= 0)) ? collection[index] : false; };

		/* Auxiliary public functions */
		/* Returns true if the supplied object is a valid object for our set (i.e.: has a value and label properties) */
		this.validObject = function(elementary) { return valid_object(elementary); };
		this.isEmpty = function() { return me.length == 0; };

	}

