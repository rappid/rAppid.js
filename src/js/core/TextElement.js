rAppid.defineClass("js.core.TextElement",
    ["js.core.Element"], function(Element) {
        function matchPlaceholder(text) {
            return text.match(/\{([a-zA-Z$._]+)\}/);
        }

        return Element.inherit({
            _initializeDescriptor:function (descriptor) {
                // find bindings and register for onchange event
                var matches = descriptor.textContent.match(/\{([a-zA-Z$._]+)\}/g);
                var key, scope;
                while (matches && matches.length > 0) {
                    key = matches.shift();
                    key = key.substr(1,key.length-2);
                    scope = this.getScopeForKey(key);
                    if (scope) {
                        var self = this;
                        scope.bind('change:' + key, function (e) {
                            self._commitChangedAttributes();
                        });
                    }
                }

            },
            render: function(){
                if (!this.$initialized) {
                    this._initialize(this.$creationPolicy);
                }

                this.$el = document.createTextNode(this.$descriptor.textContent);
                this._renderTextContent();

                return this.$el;
            },
            _renderTextContent: function(){

                var textContent = this.$descriptor.textContent;
                var matches = matchPlaceholder(textContent);
                var key, val;
                while (matches && matches.length > 0) {
                    key = matches[1];
                    val = this.get(key);
                    textContent = textContent.split("{" + key + "}").join(val);
                    matches = matchPlaceholder(textContent);
                }

                this.$el.textContent = textContent;
            },
            _commitChangedAttributes: function(){
                if(this.$el){
                    this._renderTextContent();
                }
            }
        });
    }
);