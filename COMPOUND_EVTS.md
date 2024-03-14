# Compound Events
Compound events are events that can be fired by other events.

### Creating Compound Events
Compound events are created from the `CompoundEvt` class:
```js
const compound = new CompoundEvt("my-compound-evt");
```
When using NodeJS or the ES6 module, `CompoundEvt` can be accessed as a static property of `Evt`:
```js
const CompoundEvt = Evt.CompoundEvt;
```
### Binding and Unbinding Events
Events can be bound to compound events. Bound events fire the compound event when they are fired. Events are bound using the `bind` method:
```js
const evt = new Evt("my-evt");

compound.bind(evt);

compound.addHandler(e => console.log("Fired"));

evt.call();
```
```
Output:
    Fired
```
Events can be unbound from a compound event using the `unbind` method:
```js
compound.unbind(evt);

evt.call(); // Does not fire compound
```
#### Behind the Scenes
Compound events add priority handlers to bound events that fire the compound events. This results in a some quirks:
* The handlers for compound events are called before the normal handlers and some priority handlers of the bound event:
```js
evt.addPriorityHandler(e => console.log("evt priority 1"));
evt.addHandler(e => console.log("evt handler 1"));

compound.bind(evt);

evt.addPriorityHandler(e => console.log("evt priority 2"));
evt.addHandler(e => console.log("evt handler 2"));

compound.addPriorityHandler(e => console.log("compound priority 1"));
compound.addHandler(e => console.log("compound handler 1"));

evt.call();
```
```
Output:
    evt priority 1
    compound priority 1
    compound handler 1
    evt priority 2
    evt handler 1
    evt handler 2
```
* To bind a locked event, the event's key has to be given as the last argument to the `bind` method:
```js
const evtKey = evt.lock();

compound.bind(evt); // does not work
compound.bind(evt, evtKey); // works
```

<br/>

Both `bind` and `unbind` are considered sensitive methods. For locked compound events, the key has to be given as the first argument:
```js
const key = compound.lock();

compound.bind(key, evt);
compound.bind(key, evt, evtKey);

compound.unbind(key, evt);
```
### Indirectly Firing of Compound Events
When a compound event is fired by another event, the object passed to the handlers has the data of the fired event:
* `caller`: The caller of the fired event.
* `evt`: The fired event.
* `data`: The data passed to the fired event.
* `time`: The time the fired event was fired.
**Note**: Calling the `cancel` function passed to the compound event's handlers when the event is indirectly fired only cancels the compound event:
```js
evt.addHandler(e => console.log("evt " + 1));
evt.addHandler(e => console.log("evt " + 2));

compound.addHandler(e => console.log("compound " + 1));
compound.addHandler(e => e.cancel());
compound.addHandler(e => console.log("compound " + 2));

compound.bind(evt);

evt.call();
```
```
Output:
    compound 1
    evt 1
    evt 2
```
