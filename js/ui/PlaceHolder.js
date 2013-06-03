define(["js/html/HtmlElement", "js/core/Content", "underscore"], function (HtmlElement, Content, _) {
    return HtmlElement.inherit({

        defaults: {
            /***
             * the unique identifier for the placeholder within this component
             *
             * @type String
             * @required
             */
            name: null
        },

        render: function () {
            if (this.isRendered()) {
                return this.$el;
            }

            this.$textNode = this.$stage.$document.createTextNode("");

            var el;
            if (this.$.content) {
                el = this._getDomElementForContent(this.$.content);
            }
            if (!el) {
                el = this.$textNode;
            }

            this.$el = el;

            return this.$el;
        },

        clear: function () {
            this.set({content: null});
        },

        _renderContent: function (content) {


            var parentNode = this.$el.parentNode;
            if (parentNode) {
                var el = this._getDomElementForContent(content);
                if (el) {
                    parentNode.replaceChild(el, this.$el);
                    this.$el = el;
                } else if (this.$textNode !== this.$el) {
                    parentNode.replaceChild(this.$textNode, this.$el);
                    this.$el = this.$textNode;
                }
            }

        },
        _getDomElementForContent: function (content) {
            var children;
            if (content instanceof Content) {
                children = content.$children;
            } else if (_.isArray(content)) {
                children = content;
            } else if (content) {
                children = [content];
            } else {
                children = [];
            }
            var child, el;
            for (var i = 0; i < children.length; i++) {
                child = children[i];
                if (child.render) {
                    el = child.render();
                    return el;
                }
            }

            return null;


        }
    });
});