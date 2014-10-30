define(["js/ui/View", "require"], function (View, require) {

    return View.inherit("js.ui.ComponentLoader", {

        defaults: {
            type: null,
            error: null,
            load: true,

            instance: null,
            loading: false,
            componentClass: "component-loader {class()}",
            mediaQuery: null
        },

        "class": function () {
            return [
                this.$.loading ? "loading" : "",
                this.$.error ? "error" : ""
            ].join(" ")

        }.onChange("loading", "error"),

        _renderLoad: function (load) {
            if (load) {
                this._load();
            }
        },

        clear: function () {

            var instance = this.$.instance;
            if (instance) {
                this.removeChild(instance);
            }

            this.set({
                instance: null,
                loading: false,
                error: null
            });
        },

        _matchesMediaQuery: function () {

            var mediaQuery = this.$.mediaQuery;

            if (!mediaQuery) {
                return true;
            }

            var w = this.$stage.$window;

            if (w && w.matchMedia) {
                var match = w.matchMedia(mediaQuery);
                if (match && !match.matches) {
                    return false;
                }
            }

            return true;
        },

        _load: function (type, callback) {

            if (!this._matchesMediaQuery()) {
                return;
            }

            var self = this;

            if (arguments[0] instanceof Function) {
                callback = type;
                type = null;
            }

            type = type || this.$.type;

            if (!type) {
                callback && callback("No type specified");
                return;
            }

            if (this.$.loading) {
                return;
            }

            this.set("loading", true);

            require([this.$stage.$applicationContext.getFqClassName(type)], function (Factory) {

                var attributes = {};
                for (var key in self.$) {
                    //noinspection JSUnfilteredForInLoop
                    if (!self.factory.prototype.defaults.hasOwnProperty(key)) {
                        //noinspection JSUnfilteredForInLoop
                        if (self.$bindingAttributes.hasOwnProperty(key)) {
                            // pass the binding attribute
                            //noinspection JSUnfilteredForInLoop
                            attributes[key] = self.$bindingAttributes[key].value;
                        } else {
                            // direct value
                            //noinspection JSUnfilteredForInLoop
                            attributes[key] = self.$[key];
                        }

                    }
                }

                var instance = self.createComponent(Factory, attributes);
                // use event definitions
                instance.$eventDefinitions = self.$eventDefinitions;

                self.addChild(instance);
                self.set({
                    instance: instance,
                    loading: false
                });

                callback && callback(null, instance);

            }, function (e) {
                self.set({
                    error: e,
                    loading: false
                });

                callback && callback(e);
            });

        }

    });

});