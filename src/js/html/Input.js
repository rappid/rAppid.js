var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.html.Input",
        ["js.html.DomElement"], function (DomElement) {
            return DomElement.inherit({
                _renderValue: function(value){
                    this.$el.value = value;
                },
                _renderChecked: function(checked){
                    this.$el.checked = checked;
                },
                _bindDomEvents: function(){
                    var self = this;
                    if (this.$el.type == "text" || this.$el.type == "password") {
                        this.$el.addEventListener('change', function (e) {
                            self.set('value', e.target.value);
                        });
                    } else if (this.$el.type == "checkbox" || this.$el.type == "radio") {
                        this.$el.addEventListener('change', function (e) {
                            self.set('checked', e.target.checked);
                        });
                    }
                }
            });
        }
    );
});