rAppid.defineClass("js.core.Bindable", ["js.core.EventDispatcher", "underscore"],
    /**
     * @export js.core.Bindable
     */
    function (EventDispatcher, _) {

        /**
         * @class js.core.Bindable
         * @extends js.core.EventDispatcher
         */
        return EventDispatcher.inherit({
            ctor: function (attributes) {
                this.base.ctor.callBase(this);
                this.$ = _.defaults(attributes || {}, this._defaultAttributes());
            },

            _defaults: {},

            _defaultAttributes: function() {
                return _.defaults(this._defaults, this.base._defaults);
            },

            set: function (attributes) {
                if (!(attributes instanceof Object)) {
                    throw "attributes must be a hash";
                }
            }
        });
    });