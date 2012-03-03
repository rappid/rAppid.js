var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.core.TextElement",
        ["js.core.Element", "js.core.Binding"], function (Element, Binding) {
            function matchPlaceholder(text) {
                return text.match(/\{([a-zA-Z$.\-_]+)\}/);
            }

            return Element.inherit({
                _initializeBindings: function () {
                    this.$bindings = [];
                    var textContent = this._getTextContentFromDescriptor(this.$descriptor);
                    // find bindings and register for onchange event
                    var matches = textContent.match(/\{([a-zA-Z$\-._]+)\}/g);
                    var key, scope, tKey;
                    while (matches && matches.length > 0) {
                        key = matches.shift();
                        key = key.substr(1, key.length - 2);
                        scope = this.getScopeForKey(key);
                        if (scope) {
                            tKey = key.replace(/\./g, "_");
                            this.$bindings.push(new Binding({scope: scope, path: key, target: this, targetKey: tKey}));
                            this.$[tKey] = scope.get(key);
                        }
                    }

                },
                render: function () {
                    if (!this.$initialized) {
                        this._initialize(this.$creationPolicy);
                    }

                    this.$el = document.createTextNode("");
                    if (this.$descriptor) {
                        this._renderTextContent(this._getTextContentFromDescriptor(this.$descriptor));
                    }

                    return this.$el;
                },
                _renderTextContent: function (textContent) {

                    var matches = matchPlaceholder(textContent);
                    var key, val;
                    while (matches && matches.length > 0) {
                        key = matches[1];
                        val = this.get(key.replace(/\./g, "_"));
                        if(val === null || typeof(val) === "undefined"){

                            val = "";
                        }
                        textContent = textContent.split("{" + key + "}").join(val);
                        matches = matchPlaceholder(textContent);
                    }
                    if(this.$el.textContent){
                        this.$el.textContent = textContent;
                    }else{
                        this.$el.nodeValue = textContent;
                    }

                },
                _commitChangedAttributes: function () {
                    if (this.$el && this.$descriptor) {
                        this._renderTextContent(this._getTextContentFromDescriptor(this.$descriptor));
                    }
                }
            });
        }
    );
});