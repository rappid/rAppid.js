define(["js/html/HtmlElement", "underscore"], function (HtmlElement, _) {
    var radioNameCache = {},
        undefined;

    return HtmlElement.inherit("js.html.Input", {

        $classAttributes: ['updateOnEvent', 'checked'],

        defaults: {
            /***
             * the type of the input element
             * @type String
             */
            type: 'text',

            /***
             * the checked state for radio buttons and checkboxes
             * @type Boolean
             */
            checked: false,

            /***
             * the event on which the bound value will be updated
             * @string String
             */
            updateOnEvent: 'input'
        },

        _commitChangedAttributes: function (attributes) {
            if (this.$.type === 'radio') {

                if (attributes.name) {

                    if (this.$previousAttributes.name && radioNameCache[this.$previousAttributes.name]) {
                        delete radioNameCache[this.$previousAttributes.name][this.$cid];
                    }

                    radioNameCache[attributes.name] = radioNameCache[attributes.name] || {};
                    radioNameCache[attributes.name][this.$cid] = this;
                }

            }
            this.callBase();
        },

        _renderEnabled: function (enabled) {
            if (enabled) {
                this.$el.removeAttribute("disabled");
            } else {
                this.$el.setAttribute("disabled", "disabled");
            }
        },

        _supportsPlaceholder: function () {
            return "placeHolder" in this.$el || "placeholder" in this.$el;
        },

        _renderValue: function (value) {
            if (value === null || value === undefined) {
                value = "";
            }

            if (value == "" && !this._supportsPlaceholder() && this.$.placeholder && !this.$.focused) {
                value = this.$.placeholder;

            }

            if (String(value) !== this.$el.value) {
                if (this.$.type === "date") {
                    if (value instanceof Date) {
                        var m = value.getMonth() + 1;
                        m = m < 10 ? "0" + m : m;
                        var d = value.getDate();
                        d = d < 10 ? "0" + d : d;
                        value = [value.getFullYear(), m, d].join("-");
                    }
                }
                this.$el.value = value;
            }
        },

        _commitChecked: function (checked) {
            // sync shadow dom
            if (checked && this.$.type === "radio") {
                var cache = radioNameCache[this.$.name];
                for (var id in cache) {
                    if (cache.hasOwnProperty(id)) {
                        if (cache[id] !== this) {
                            cache[id].set('checked', false);
                        }
                    }
                }
            }
        },

        _renderChecked: function (checked) {
            this.$el.checked = checked ? "checked" : false;
        },

        _transformValue: function (value) {
            if (this.$.type === "number") {
                if (value === "") {
                    return null;
                }
                value = parseInt(value, 10);
                if (isNaN(value)) {
                    value = this.$.value;
                }
            } else if (this.$.type === "date") {
                try {
                    value = value !== "" ? new Date(value) : null;
                } catch (e) {
                    this.log("Invalid Date", "warn");
                    value = this.$.value;
                }
            }

            return value;
        },

        _bindDomEvents: function () {

            var self = this;
            if (this.$.type === "checkbox" || this.$.type === "radio") {
                this.bindDomEvent('click', function (e) {
                    self.set('checked', self.$el.checked);
                });
            } else {
                if (this.$.type === "date" || this.$.type === "number") {
                    this.$.updateOnEvent = "change";
                }
                // fix for IE
                if (this.$.updateOnEvent === "input" && "onpropertychange" in this.$el) {
                    this.bindDomEvent("keyup", function () {
                        self.set('value', self._transformValue(self.$el.value));
                    });
                } else {
                    this.bindDomEvent(this.$.updateOnEvent, function () {
                        self.set('value', self._transformValue(self.$el.value));
                    });
                }
                // this is needed to make sure the component has the same value as the input field
                this.bindDomEvent("blur", function () {
                    var transformedValue = self._transformValue(self.$el.value);
                    if (transformedValue !== self.$.value) {
                        self.set('value', transformedValue);
                    }
                });

            }

            this.callBase();
        },
        _renderPlaceholder: function (placeholder) {
            // shim for placeholder
            if (!this._supportsPlaceholder()) {
                var self = this;
                if (!this.__blurHandler) {
                    this.__blurHandler = function (e) {
                        self.set('focused', false);
                        if (self.$el.value != "") {
                            return;
                        }
                        self.$el.value = self.$.placeholder || "";
                        self.addClass('placeholder');
                    };
                    this.bindDomEvent('blur', this.__blurHandler);
                }
                if (!this.__focusHandler) {
                    this.__focusHandler = function () {
                        self.set('focused', true);
                        self.removeClass('placeholder');
                        if (!self.$.value) {
                            self.$el.value = '';
                        }

                    };
                    this.bindDomEvent("focus", this.__focusHandler);
                }
                if (placeholder) {
                    this.addClass('placeholder');
                }
            } else {
                this._setAttribute("placeHolder", placeholder);
            }
        }
    });
});