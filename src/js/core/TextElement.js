rAppid.defineClass("js.core.TextElement",
    ["js.core.Element"], function(Element) {
        return Element.inherit({
            _construct:function (descriptor, applicationDomain) {
                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;
            },
            _initializeDescriptor:function (descriptor) {

                var textContent = descriptor.textContent;

                function matchPlaceholder(text){
                    return text.match(/{([a-zA-Z\._]+)}/);
                }

                var matches = matchPlaceholder(textContent);
                var key, val;
                while (matches && matches.length > 0) {
                    key = matches[1];
                    val = this._getPropertyForPlaceholder(key);
                    textContent = textContent.replace(new RegExp("{"+key+"}","g"),val);
                    matches = matchPlaceholder(textContent);
                }
                this.$textContent = textContent;
            },
            render: function(){
                if (!this.$initialized) {
                    this._initialize(this.$creationPolicy);
                }
                return document.createTextNode(this.$textContent);
            }
        });
    }
);