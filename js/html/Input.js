define(["js/html/DomElement"], function (DomElement) {
        return DomElement.inherit("js.html.Input", {
            defaults: {
                checked: false
            },
            _renderValue: function (value) {
                this.$el.value = value;
            },
            _renderChecked: function (checked) {
                this.$el.checked = checked;
            },
            _bindDomEvents: function () {

                var self = this;
                if (this.$.type == "text" || this.$.type == "password") {
                    this.addEventListener('change', function (e) {
                        self.set('value', self.$el.value);
                    });
                } else if (this.$.type == "checkbox" || this.$.type == "radio") {
                    this.addEventListener('click', function (e) {
                        self.set('checked', self.$el.checked);
                    });
                } else if(this.$.type == "number" ){
                    this.addEventListener('change', function (e) {
                        var val = parseInt(self.$el.value);
                        if(isNaN(val)){
                            self.$el.value = self.$.value;
                        }
                        self.set('value', self.$el.value);
                    });
                }

                this.callBase();
            }
        });
    }
);