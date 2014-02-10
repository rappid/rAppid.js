define(["js/ui/View", "require"], function(View, require) {

    return View.inherit("js.ui.ComponentLoader", {

        defaults: {
            type: null,
            error: null,
            load: true,

            instance: null,
            loading: false,
            componentClass: "component-loader {class()}"
        },

        "class": function() {
            return [
                this.$.loading ? "loading" : "",
                this.$.error ? "error" : ""
            ].join(" ")

        }.onChange("loading", "error"),

        _renderLoad: function(load) {
            if (load) {
                this._load();
            }
        },

        _load: function(callback) {

            var self = this;

            if (this.$.loading) {
                return;
            }

            this.set("loading", true);

            require([this.$stage.$applicationContext.getFqClassName(this.$.type)], function(Factory) {

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
                self.addChild(instance);
                self.set({
                    instance: instance,
                    loading: false
                });

                callback && callback(null, instance);

            }, function(e) {
                self.set({
                    error: e,
                    loading: false
                });

                callback && callback(e);
            });

        }

    });

});