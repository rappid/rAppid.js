define(["js/ui/View"], function (View) {
    return View.inherit({

        defaults: {

            item: null,
            /***
             * the template name which to use
             *
             * @type String
             * @required
             */
            templateName: null
        },

        $classAttributes: ["item", "templateName"],

        _renderTemplateName: function (templateName) {
            if (templateName) {
                if (!this.$template) {
                    this.$template = this.getTemplate(templateName);
                }

                if (!this.$templateChildren) {
                    this.$templateChildren = this.$template.createComponents({
                        item: this.$.item
                    }, this.$template.$parentScope);

                    var child;
                    for (var i = 0; i < this.$templateChildren.length; i++) {
                        child = this.$templateChildren[i];
                        if (child.$classAttributes) {
                            child.$classAttributes.push("item");
                        }

                        this.addChild(child);
                    }

                }
            } else {
                this.$template = null;
                // TODO: remove child
            }
        },
        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (this.$templateChildren && attributes.hasOwnProperty("item")) {
                for (var i = 0; i < this.$templateChildren.length; i++) {
                    this.$templateChildren[i].set("item", attributes["item"]);
                }
            }
        }
    });
});