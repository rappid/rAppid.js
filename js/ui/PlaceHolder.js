define(
    ["js/core/UIComponent", "js/core/Content", "underscore"], function (UIComponent, Content, _) {
        return UIComponent.inherit({
            render: function () {
                if (this.isRendered()) {
                    return this.$el;
                }

                this.$textNode = this.$stage.$document.createTextNode("");
                this.$el = this.$textNode;

                return this.$el;
            },
            clear: function () {
                this.set({content: this.$textNode});
            },
            _renderContent: function (content) {
                var children;
                if (content instanceof Content) {
                    children = content.$children;
                } else if (_.isArray(content)) {
                    children = content;
                } else {
                    children = [content];
                }

                var child, el;
                for (var i = 0; i < children.length; i++) {
                    child = children[i];
                    if (child.render) {
                        el = child.render();
                        var parentNode = this.$el.parentNode;
                        parentNode.insertBefore(el, this.$el);
                    }
                }
            }
        });
    }
);