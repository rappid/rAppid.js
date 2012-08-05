define(["js/html/HtmlElement", "underscore"], function (HtmlElement, _) {
        var radioNameCache = {};

        return HtmlElement.inherit("js.html.Input", {
            $classAttributes: ['updateOnEvent','checked'],
            defaults: {
                type: 'text',
                checked: false,
                updateOnEvent: 'keyup'
            },
            _commitChangedAttributes: function(attributes){
                if(this.$.type === 'radio'){

                    if(attributes.name){

                        if (this.$previousAttributes.name) {
                            delete radioNameCache[this.$previousAttributes.name][this.$cid];
                        }

                        radioNameCache[attributes.name] = radioNameCache[attributes.name] || {};
                        radioNameCache[attributes.name][this.$cid] = this;
                    }

                }
                this.callBase();
            },
            _renderValue: function (value) {
                if(!_.isUndefined(value) && value !== this.$el.value){
                    this.$el.value = value;
                }
            },
            _commitChecked: function(checked){
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
                this.$el.checked = checked;
            },
            _bindDomEvents: function () {

                var self = this;
                if (this.$.type === "text" || this.$.type === "password") {
                    this.bindDomEvent(this.$.updateOnEvent, function (e) {
                        self.set('value', self.$el.value);
                    });
                } else if (this.$.type === "checkbox" || this.$.type === "radio") {
                    this.bindDomEvent('click', function (e) {
                        self.set('checked', self.$el.checked);

                    });
                } else if(this.$.type == "number" ){
                    this.bindDomEvent('change', function (e) {
                        var val = parseInt(self.$el.value);
                        if(isNaN(val)){
                            val = self.$.value;
                        }
                        self.set('value', val);
                    });
                }

                this.callBase();
            }
        });
    }
);