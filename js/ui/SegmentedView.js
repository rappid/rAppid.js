define(
    ["js/ui/View", "js/html/HtmlElement"], function (View, HtmlElement) {
        return View.inherit({
            defaults: {
                tagName: "div",

                visibleView: null,

                /***
                 * shows the component with the visible index
                 *
                 * @type {Number}
                 */
                visibleIndex: null
            },

            ctor: function () {
                this.$views = [];
                this.callBase();
            },

            addChild: function (child) {
                if (child instanceof HtmlElement) {
                    this.$views.push(child);
                }
                this.callBase();
            },

            _renderChild: function (child) {
                if (this.$.visibleView == child) {
                    child.set({visible: true});
                    var i = this.$children.indexOf(child);
                    this.set('visibleIndex', i);
                    this.callBase();
                }
            },

            _renderVisibleView: function (child, oldView) {
                if (oldView) {
                    oldView.set({visible: false});
                }

                if (child) {
                    if (!child.isRendered()) {
                        child.set({visible: false});
                        this._renderChild(child);
                    }
                    child.set({visible: true});
                }

            },

            _renderVisibleIndex: function (index) {
                if (index != null && index > -1 && index < this.$views.length) {
                    this.set({visibleView: this.$views[index]});
                } else if (this.$.visibleView) {
                    this.$.visibleView.set({visible: false});
                }
            }

        });
    }
);