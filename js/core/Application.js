rAppid.defineClass("js.core.Application",
    ["js.core.UIComponent"], function (UIComponent) {
        return UIComponent.inherit({
            ctor: function() {
                this.base.ctor.callBase(this);
            },
            start: function(callback) {
                if (callback) {
                    callback(null);
                }
            },
            render: function (target) {
                // TODO: call base method
                var dom = this.base.render.callBase(this);

                if (target) {
                    target.appendChild(dom);
                }

                return dom;
            },
            toString: function () {
                return "js.core.Application";
            }
        });
    }
);