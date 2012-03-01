var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.core.UIComponent",
        ["js.html.DomElement"], function (DomElement) {
            return DomElement.inherit({
                defaults: {
                    tagName: "div"
                },
                $behavesAsDomElement: false,
                _commitChangedAttributes: function (attributes) {
                    if (this.isRendered()) {
                        this._renderAttributes(attributes);
                    }
                },
                _initializationComplete: function () {
                    this.callBase();
                }
            });
        }
    );
});