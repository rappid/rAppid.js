var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.html.TextArea",
        ["js.html.DomElement", "js.core.TextElement"], function (DomElement, TextElement) {
            return DomElement.inherit({
                _renderChild: function(child){
                    if(child instanceof TextElement){
                        // contains two way binding ...
                        var text = child.$descriptor.textContent;
                        if(this._isBindingDefinition(text)){
                            this._initBinding(text,"value");
                        }
                    }
                    //this.callBase();
                },
                _renderValue: function(value){
                    this.$el.textContent = value;
                },
                _bindDomEvents: function(){
                    var self = this;
                    this.$el.addEventListener('change', function (e) {
                        self.set('value', e.target.value);
                    });
                }
            });
        }
    );
});