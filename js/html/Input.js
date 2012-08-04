define(["js/html/HtmlElement", "underscore"], function (HtmlElement, _) {
        var radioElementCache = {};

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
                        radioElementCache[attributes.name + this.$cid] = this;
                    }
                    if(this.$previousAttributes.name){
                        delete radioElementCache[this.$previousAttributes.name + this.$cid];
                    }
                }
                this.callBase();
            },
            _renderValue: function (value) {
                if(!_.isUndefined(value) && value !== this.$el.value){
                    this.$el.value = value;
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
                        if(self.$.type === "radio"){
                            for(var id in radioElementCache){
                                if(radioElementCache.hasOwnProperty(id)){
                                    if(radioElementCache[id] !== self){
                                        radioElementCache[id].set('checked', false);
                                    }
                                }
                            }
                        }

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