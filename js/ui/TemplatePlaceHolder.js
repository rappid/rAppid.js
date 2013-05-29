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

        _renderTemplateName: function(templateName){
            if (templateName) {
                if (!this.$template) {
                    this.$template = this.getTemplate(templateName);
                }

                if(!this.$templateInstance){
                    this.$templateInstance = this.$template.createInstance({
                        item: this.$.item
                    }, this.$parentScope, this.$rootScope);

                    if(this.$templateInstance.$classAttributes){
                        this.$templateInstance.$classAttributes.push("item");
                    }

                    this.addChild(this.$templateInstance);
                }
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