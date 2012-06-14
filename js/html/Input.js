define(["js/html/HtmlElement"], function (HtmlElement) {
        return HtmlElement.inherit("js.html.Input", {
            $classAttributes: ['updateOnEvent','checked'],
            defaults: {
                type: 'text',
                checked: false,
                updateOnEvent: 'keyup'
            },
            _renderValue: function (value) {
                if(value !== this.$el.value){
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
                    });
                } else if(this.$.type == "number" ){
                    this.bindDomEvent(this.$.updateOnEvent, function (e) {
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