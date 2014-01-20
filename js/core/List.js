define(["js/core/EventDispatcher", "js/core/Bindable", "underscore"], function (EventDispatcher, Bindable, _) {


    var List = Bindable.inherit("js.core.List", {
        /**
         * List constructor
         * @param {Array} items to add
         * @param {Object} options - attributes to set
         */
        ctor: function (items, options) {
            options = options || {};

            this.$items = [];
            this.$itemEventMap = {};

            this.callBase(options);

            if (items) {
                this.add(items);
            }

            var self = this;

            function updateLength() {
                self.length = self.size();
            }

            // TODO: allow array here to give multiple event hin
            this.bind('add', updateLength);
            this.bind('remove', updateLength);
            this.bind('reset', updateLength);

            this.length = this.size();
        },
        /**
         *
         * @return {bool} true if list has items
         */
        isEmpty: function () {
            return this.$items.length === 0;
        }.on('*'),
        /**
         * Pushes one item to the list
         * @param item
         */
        push: function (item) {
            this.add(item);
        },
        /**
         * Removes last item  of the list
         * @return {*}
         */
        pop: function () {
            return this.removeAt(this.$items.length - 1);
        },
        /**
         * Removes first item of list
         * @return {*}
         */
        shift: function () {
            return this.removeAt(0, {});
        },
        /**
         * Adds item to first position of list
         * @param item
         */
        unshift: function (item) {
            this.add(item, {
                index: 0
            });
        },
        /**
         * This method adds one ore items to the array.
         * @param {Array|Object} items
         * @param {Object} options
         */
        add: function (items, options) {


            options = options || {};
            _.defaults(options, {silent: false, index: this.$items.length});

            var index = options.index;

            if (!_.isArray(items)) {
                items = [items];
            }
            var item, itemIndex;
            for (var i = 0; i < items.length; i++) {
                item = items[i];
                if (item instanceof Bindable) {
                    item.bind('change', this._onItemChange, this);
                    item.bind('*', this._onItemEvent, this);
                }
                itemIndex = index + i;
                if (_.isUndefined(this.$items[itemIndex]) || itemIndex >= this.$items.length) {
                    this.$items[itemIndex] = item;
                } else {
                    this.$items.splice(itemIndex, 0, item);
                }
                if (options.silent !== true) {
                    this.trigger('add', {item: item, index: itemIndex});
                }
            }
        },
        /**
         *
         * @param {Event} e
         * @param {Object} item
         * @private
         */
        _onItemChange: function (e, item) {
            this.trigger('change', {item: item, index: this.indexOf(item), changedAttributes: e.$});
        },
        _onItemEvent: function (e, item) {
            if (this.$itemEventMap[e.type]) {
                this.trigger("item:" + e.type, {item: item, index: this.indexOf(item), itemEvent: e});
            }
        },
        /**
         * Removes an Array or just one item from the list. Triggers remove events.
         * @param {Object|Array} items
         * @param {Object} options
         */
        remove: function (items, options) {
            var removed = [];

            if (!_.isArray(items)) {
                items = [items];
            }
            var item;
            for (var i = 0; i < items.length; i++) {
                item = this.removeAt(this.indexOf(items[i]), options);
                item && removed.push(item);
            }
            return removed;
        },
        /**
         * Returns the index of the item
         * @param {Object} item
         * @return {Number} index
         */
        indexOf: function (item) {
            return this.$items.indexOf(item);
        },
        /**
         * Removes one item a specific index and triggers remove event
         * @param {Number} index
         * @param {Object} options
         * @return {Object} removed item
         */
        removeAt: function (index, options) {
            options = options || {};

            if (index > -1 && index < this.$items.length) {
                var items = this.$items.splice(index, 1),
                    item = items[0];

                if (options.silent !== true) {
                    this.trigger('remove', {item: item, index: index});
                }
                if (item instanceof Bindable) {
                    item.unbind('*', this._onItemEvent, this);
                    item.unbind('change', this._onItemChange, this);
                }
                return items[0];
            }
            return null;
        },
        /**
         * Resets the list with the given items and triggers reset event
         * @param {Array} items
         * @param {Object} options
         */
        reset: function (items, options) {
            items = items || [];
            var self = this;
            this.each(function (item) {
                if (item instanceof EventDispatcher) {
                    item.unbind('*', self._onItemEvent, self);
                    item.unbind('change', self._onItemChange, self);
                }
            });

            this.$items = items || [];

            this.each(function (item) {
                if (item instanceof EventDispatcher) {
                    item.bind('*', self._onItemEvent, self);
                    item.bind('change', self._onItemChange, self);
                }
            });

            options = options || {};
            if (!options.silent) {
                this.trigger('reset', {items: items});
            }
        },

        /**
         * Clears all items and triggers reset event
         * @param {Object} options
         */
        clear: function (options) {
            this.reset([], options);
        },
        /**
         * Returns the size of the list
         */
        size: function () {
            return this.$items.length;
        }.on('*'),

        /**
         * Returns item at a specific index
         * @param index
         * @return {*}
         */
        at: function (index) {
            if (index < this.$items.length && index >= 0) {
                return this.$items[index];
            }
            return null;
        }.on('*'),
        /**
         * Iterates over all items with given callback
         * @param {Function} fnc callback with signature function(item, index)
         * @param {Object} scope The call scope of the callback
         */
        each: function (fnc, scope) {
            scope = scope || this;

            for (var i = 0; i < this.$items.length; i++) {
                fnc.call(scope, this.$items[i], i, this.$items);
            }
        },
        /**
         * Iterates over all items with the function.
         * Returns the element when the function returns true.
         *
         * @param {Function} fnc Function to execute on each value in the list
         * @param {Object} scope The this object
         * @returns {*}
         */
        find: function (fnc, scope) {
            scope = scope || this;
            var b = false,
                items = this.$items,
                length = items.length;

            for (var i = 0; i < length; i++) {
                b = fnc.call(scope, items[i], i, this.$items);
                if (b === true) {
                    break;
                }
            }

            return i < length ? items[i] : null;
        },

        /**
         * Checks if item is included in List
         * @return {Boolean}
         */
        includes: function (item) {
            return _.contains(this.$items, item);
        }.on('*'),

        contains: function(item){
            return _.contains(this.$items, item);
        }.on('*'),

        /**
         * Returns a fresh copy of the List
         * @return {List} a fresh copy of the list
         */
        clone: function () {
            var attributes = this._cloneAttribute(this.$);
            var items = this._cloneAttribute(this.$items);
            var ret = new this.factory(items, attributes);
            ret._$source = this;
            return ret;
        },
        /**
         * Syncs the items back to the source
         * @return {*}
         */
        sync: function () {
            if (this._$source) {
                var item, items = [];
                for (var i = 0; i < this.$items.length; i++) {
                    item = this.$items[i];
                    if (item instanceof Bindable && item.sync()) {
                        item = item._$source;
                    }
                    items.push(item);
                }
                this._$source.reset(items);
            }
            return this.callBase();
        },

        _innerDestroy: function () {
            this.$itemEventMap = {};
            this.callBase();
        },

        bind: function (eventType, callback, scope) {
            var i = eventType.indexOf("item:");
            if (i === 0) {
                var itemEvent = eventType.substr("item:".length);
                this.$itemEventMap[itemEvent] = this.$itemEventMap[itemEvent] || [];
                this.$itemEventMap[itemEvent].push({
                    eventType: eventType,
                    callback: callback,
                    scope: scope
                });
            }
            this.callBase();
        },

        unbind: function (eventType, callback, scope) {
            var i = eventType.indexOf("item:");
            if (i === 0) {
                var itemEvent = eventType.substr("item:".length),
                    listeners = this.$itemEventMap[itemEvent] || [],
                    listener;

                for (var j = listeners.length - 1; j > -1; j--) {
                    listener = listeners[j];
                    if (listener.callback === callback && listener.scope === scope) {
                        listeners.splice(i, 1);
                    }
                }
            }
            this.callBase();
        },

        /***
         * Transforms List to an array
         * You can specify a transform fnc
         * @param {Function} transformFnc
         * @return {Array}
         */
        toArray: function (transformFnc) {
            var ret = [];
            transformFnc = transformFnc || function (item, index) {
                return item;
            };


            this.each(function (item, index) {
                ret.push(transformFnc(item, index));
            });

            return ret;
        },

        /**
         * Sorts the list by the given function and triggers sort event
         * @param {Function} fnc
         */
        sort: function (fnc) {
            if (fnc instanceof Function) {
                // TODO:
                this.trigger('sort', {items: this.$items.sort(fnc), sortFnc: fnc});
            }
            return this;
        },
        /**
         * Checks if items are deep equal
         * @param {js.core.List} list
         * @return {boolean}
         */
        isDeepEqual: function (list) {
            if (list.size() !== this.size()) {
                return false;
            }
            var isEqual = true,
                a, b;
            for (var i = 0; i < this.$items.length; i++) {
                a = this.$items[i];
                b = list.at(i);
                if (a instanceof Bindable && b instanceof Bindable) {
                    if (!a.isDeepEqual(b)) {
                        return false;
                    }
                } else if (a instanceof Bindable || b instanceof Bindable) {
                    return false;
                } else {
                    isEqual = _.isEqual(a, b);
                }
            }

            return isEqual;
        }
    });

    return List;
});