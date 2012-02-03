rAppid.defineClass("js.core.Bindable", ["js.core.EventDispatcher", "underscore"],
    /**
     * @export js.core.Bindable
     */
    function (EventDispatcher) {

        /**
         * @class js.core.Bindable
         * @extends js.core.EventDispatcher
         */
        return EventDispatcher.inherit({
            ctor: function (attributes) {
                this.base.ctor.callBase(this);
                this.$ = _.defaults(attributes || {}, this._defaultAttributes);
            },

            _defaultAttributes: {},

            set: function (attributes) {
                if (!(attributes instanceof Object)) {
                    throw "attributes must be a hash";
                }
            }
        });
    });