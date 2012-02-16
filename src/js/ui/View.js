rAppid.defineClass("js.ui.View",
    ["underscore", "js.core.UIComponent", "js.core.Template"], function (_, UIComponent, Template) {
        return UIComponent.inherit({
            defaults: {
                tagName: "div"
            },


            render: function(){

                this.$el = this.callBase();

                var layout = this.getTemplate('layout');
                // layout template available...
                if(layout){
                    var children = layout.createComponents({});
                    // this._initializeChildren(children);
                    this._renderChildren(children);
                }
                return this.$el;
            },
            // TODO: change Cid to name
            getPlaceholderByCid: function(cid){
                for(var i = 0 ; i < this.$children.length; i++){
                    if(this.$children[i].$.cid === cid){
                        return this.$children[i];
                    }
                }
                return null;
            },
            _renderClass: function(className){
                $(this.$el).addClass(className);
            },
            _renderTemplateToPlaceHolder:function (templateName, placeholderCid, attributes) {
                this.$renderedPlaceholders = this.$renderedPlaceholders || {};
                var renderedComponent = this.$renderedPlaceholders[placeholderCid];
                if (!renderedComponent) {
                    var template = this.getTemplate(templateName);
                    if (template) {
                        // TODO: maybe render all components returned
                        // or create special method createComponent
                        renderedComponent = template.createComponents(attributes)[0];
                        // renderedComponent._initialize();
                        var placeholder = this.getPlaceholderByCid(placeholderCid);
                        if (placeholder) {
                            placeholder.set({content:renderedComponent});
                            this.$renderedPlaceholders[placeholderCid] = renderedComponent;
                        } else{
                            throw "No placeholder '"+placeholderCid+"' found";
                        }

                    }
                } else {
                    renderedComponent.set(attributes);
                }

            }
        });
    }
);