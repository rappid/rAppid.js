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

        _commitTemplateName: function(templateName){
            if (templateName) {
                if (!this.$template) {
                    this.$template = this.getTemplate(templateName);
                }

                this.$templateInstance = this.$template.createInstance({
                    item: this.$.item
                }, this.$parentScope, this.$rootScope);

                this.$templateInstance.$classAttributes.push("item");

                this.addChild(this.$templateInstance);
            } else {
                this.$template = null;
                // TODO: remove child
            }
        },
        _commitChangedAttributes: function(attributes){
            this.callBase();
            if(this.$templateInstance && attributes.hasOwnProperty("item")){
                this.$templateInstance.set("item",attributes["item"]);
            }
        }
    });
});