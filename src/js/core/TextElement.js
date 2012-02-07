rAppid.defineClass("js.core.TextElement",
    ["js.core.Element"], function(Element) {
        return Element.inherit({
            _initializeDescriptor:function (descriptor) {

            },
            render: function(){
                if (!this.$initialized) {
                    this._initialize(this.$creationPolicy);
                }

                function matchPlaceholder(text) {
                    return text.match(/{([a-zA-Z\._]+)}/);
                }
                var textContent = this.$descriptor.textContent;
                var matches = matchPlaceholder(textContent);
                var key, val;
                while (matches && matches.length > 0) {
                    key = matches[1];
                    val = this.get(key);
                    textContent = textContent.replace(new RegExp("{" + key + "}", "g"), val);
                    matches = matchPlaceholder(textContent);
                }

                return document.createTextNode(textContent);
            }
        });
    }
);