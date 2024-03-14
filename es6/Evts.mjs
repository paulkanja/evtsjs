/**
 * ES6 evts module
 * @module https://cdn.jsdelivr.net/gh/paulkanja/evtsjs@main/es6/Enum.mjs
**/

/**
 * An event class
**/
class Evt
{
	/**
	 * @private
	 * @type {string}
	**/
	#name;
	/**
	 * @private
	 * @type {function[]}
	**/
	#priorityHandlers = [];
	/**
	 * @private
	 * @type {function[]}
	**/
	#handlers = [];
	/**
	 * @private
	 * @type {null|Symbol}
	**/
	#key = null;
	/**
	 * @private
	 * @type {boolean}
	**/
	#pending = false;
	
	/**
	 * @public
	 * @readonly
	**/
	get name () { return this.#name; }
	/**
	 * @public
	 * @readonly
	**/
	get locked () { return !!this.#key; }
	/**
	 * @public
	 * @readonly
	**/
	get pending () { return this.#pending; }
	
	/**
	 * Creates an instance of Evt
	 * @constructor
	 * @param {string} name
	**/
	constructor (name)
	{
		this.#name = String(name ?? "");
	}
	
	/**
	 * Checks if the given key unlocks the Evt
	 * @public
	 * @param {*} key
	 * @return {boolean}
	**/
	validateKey (key)
	{
		return (!this.#key || this.#key === key);
	}
	
	/**
	 * Locks the Evt and returns the key to unlock it
	 * @public
	 * @return {Symbol}
	**/
	lock ()
	{
		if (this.#key) return null;
		this.#key = Symbol(this);
		return this.#key;
	}
	
	/**
	 * Unlocks the evt if the correct key is given
	 * @public
	 * @param {*} key
	 * @return {null|Symbol}
	**/
	unlock (key)
	{
		if (this.#key !== key) return null;
		this.#key = null;
		return key;
	}
	
	/**
	 * @overload
	 * @param {function} handler
	**/
	/**
	 * Adds a function to the priority handlers list
	 * @public
	 * @param {*} key
	 * @param {function} handler
	**/
	addPriorityHandler (key, handler)
	{
		if (arguments.length == 1 && !this.key) handler = key;
		if (this.validateKey(key) && typeof handler == "function" && !this.#priorityHandlers.includes(handler)) this.#priorityHandlers.push(handler);
	}
	
	/**
	 * @overload
	 * @param {...function} handlers
	**/
	/**
	 * Adds functions to the priority handlers list
	 * @public
	 * @param {*} key
	 * @param {...function} handlers
	**/
	addPriorityHandlers (key, ...handlers)
	{
		if (typeof arguments[0] == "function" && !this.key) handlers.unshift(key);
		if (this.validateKey(key)) for (const handler of handlers) if (typeof handler == "function" && !this.#priorityHandlers.includes(handler)) this.#priorityHandlers.push(handler);
	}
	
	/**
	 * @overload
	 * @param {function} handler
	**/
	/**
	 * Removes a function from the priority handlers list
	 * @public
	 * @param {*} key
	 * @param {function} handler
	**/
	removePriorityHandler (key, handler)
	{
		if (arguments.length == 1 && !this.key) handler = key;
		if (this.validateKey(key) && this.#priorityHandlers.includes(handler)) this.#priorityHandlers.splice(this.#priorityHandlers.indexOf(handler), 1);
	}
	
	/**
	 * @overload
	 * @param {...function} handlers
	**/
	/**
	 * Removes functions from the priority handlers list
	 * @public
	 * @param {*} key
	 * @param {...function} handlers
	**/
	removePriorityHandlers (key, ...handlers)
	{
		if (typeof arguments[0] == "function" && !this.key) handlers.unshift(key);
		if (this.validateKey(key)) for (const handler of handlers) if (typeof handler == "function" && !this.#priorityHandlers.includes(handler)) this.#priorityHandlers.splice(this.#priorityHandlers.indexOf(handler), 1);
	}
	
	/**
	 * Clears the priority handlers list
	 * @public
	 * @param {*} key
	**/
	clearPriorityHandlers (key)
	{
		if (this.validateKey(key)) this.#priorityHandlers = [];
	}
	
	/**
	 * Adds a function to the handlers list
	 * @public
	 * @param {function} handler
	**/
	addHandler (handler)
	{
		if (typeof handler == "function" && !this.#handlers.includes(handler)) this.#handlers.push(handler);
	}
	
	/**
	 * Adds functions to the handlers list
	 * @public
	 * @param {...function} handlers
	**/
	addHandlers (...handlers)
	{
		for (const handler of handlers) this.addHandler(handler);
	}
	
	/**
	 * Removes a function from the handlers list
	 * @public
	 * @param {function} handler
	**/
	removeHandler (handler)
	{
		if (this.#handlers.includes(handler)) this.#handlers.splice(this.#handlers.indexOf(handler), 1);
	}
	
	/**
	 * Removes functions from the handlers list
	 * @public
	 * @param {...function} handlers
	**/
	removeHandlers (...handlers)
	{
		for (const handler of handlers) this.removeHandler(handler);
	}
	
	/**
	 * Clears the handlers list
	 * @public
	**/
	clearHandlers ()
	{
		this.#handlers = [];
	}
	
	/**
	 * Adds functions to the handlers list
	 * @public
	 * @param {...function} handlers
	**/
	on (...handlers)
	{
		if (handlers.length == 1) this.addHandler(handlers[0]);
		else this.addHandlers(...handlers);
	}
	
	/**
	 * Creates an instance to be passed to handlers when the Evt is called
	 * @private
	 * @param {object} properties
	 * #return {object}
	**/
	#getInstance (properties)
	{
		const instance = {};
		
		for (const property in properties) Object.defineProperty(instance, property, {get: () => properties[property]});
		
		return instance;
	}
	
	/**
	 * Fires the Evt, calling all specified handlers
	 * @public
	 * @param {*} key
	 * @param {*} [caller=null]
	 * @param {*} [data=null]
	 * @param {object} [opts={}]
	 * @return {object}
	**/
	call (key, caller = null, data = null, opts = {})
	{
		if (this.pending || !this.validateKey(key)) return null;
		this.#pending = true;
		let cancelled = false;
		
		const instance = this.#getInstance({
			caller,
			evt: opts.overrideEvt || this,
			data,
			cancel: () => cancelled = true,
			time: opts.overrideTime || Date.now()
		});
		
		for (const handler of this.#priorityHandlers)
		{
			handler(instance, this);
			if (cancelled) break;
		}
		
		for (const handler of this.#handlers)
		{
			if (cancelled) break;
			handler(instance, this);
		}
		
		this.#pending = false;
		return instance;
	}
}

/**
 * An event class that can be fired by other events
**/
class CompoundEvt extends Evt
{
	/**
	 * @private
	 * @type {Symbol}
	**/
	#key;
	
	/**
	 * @private
	 * @type {Evt[]}
	**/
	#evts = [];
	/**
	 * @private
	 * @type {object[]}
	**/
	#evtsData = [];
	
	/**
	 * @public
	 * @readonly
	**/
	get locked () { return !!this.#key; }
	
	/**
	 * Creates an instance of CompoundEvt
	 * @constructor
	 * @param {string} name
	*/
	constructor (name)
	{
		super(name);
	}
	
	/**
	 * Checks if the given key unlocks the Evt
	 * @public
	 * @param {*} key
	 * @return {boolean}
	**/
	validateKey (key)
	{
		return (!this.#key || this.#key === key);
	}
	
	/**
	 * Locks the Evt and returns the key to unlock it
	 * @public
	 * @return {Symbol}
	**/
	lock ()
	{
		if (this.#key) return null;
		this.#key = Symbol(this);
		return this.#key;
	}
	
	/**
	 * Unlocks the evt if the correct key is given
	 * @public
	 * @param {*} key
	 * @return {null|Symbol}
	**/
	unlock (key)
	{
		if (this.#key !== key) return null;
		this.#key = null;
		return key;
	}
	
	/**
	 * Fires the CompoundEvt with data from another Evt firing instance
	 * @private
	 * @param {object} e
	**/
	#call (e)
	{
		return this.call(this.#key, e.caller, e.data, {overrideEvt: e.evt, overrideTime: e.time});
	}
	
	/**
	 * @overload
	 * @param {Evt} evt
	 * @param {*} evtKey
	**/
	/**
	 * Binds an Evt to the CompoundEvt.
	 * Firing the bound Evt will also fire the CompoundEvt
	 * @param {*} key
	 * @param {Evt} evt
	 * @param {*} evtKey
	**/
	bind (key, evt, evtKey)
	{
		if (!this.locked && key instanceof Evt) [evt, evtKey] = [key, evt];
		if (evt === this || !(evt instanceof Evt && this.validateKey(key) && evt.validateKey(evtKey))) return null;
		if (this.#evts.includes(evt)) return this;
		const handler = e => this.#call(e);
		evt.addPriorityHandler(evtKey, handler);
		const i = this.#evts.length;
		this.#evts[i] = evt;
		this.#evtsData[i] = {key: evtKey, handler};
		return this;
	}
	
	/**
	 * @overload
	 * @param {Evt} evt
	**/
	/**
	 * Unbinds an Evt from the CompoundEvt.
	 * @param {*} key
	 * @param {Evt} evt
	**/
	unbind (key, evt)
	{
		if (!this.locked && key instanceof Evt) evt = key;
		if (!(evt instanceof Evt && this.#evts.includes(evt))) return null;
		const i = this.#evts.indexOf(evt);
		const evtData = this.#evtsData[i];
		if (!(this.validateKey(key) && evt.validateKey(evtData.key))) return null;
		evt.removePriorityHandler(evtData.key, evtData.handler);
		this.#evts.splice(i, 1);
		this.#evtsData.splice(i, 1);
		return this;
	}
}

Object.defineProperty(Evt, "CompoundEvt", {value: CompoundEvt});

export default Evt;