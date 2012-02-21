rAppid.defineClass("js.ui.View",
    ["underscore", "js.core.UIComponent", "js.core.Template", "js.core.Content"], function (_, UIComponent, Template, Content) {
        return UIComponent.inherit({
            defaults: {
                tagName: "div"
            },
            render: function(){
                // look if the component has a layout defined
                var layout = this.$templates['layout'];
                // if layout template available...
                if(layout){
                    var children = layout.createComponents({});
                    this._initializeLayoutChildren(children);
                }
                return this.callBase();
            },
            _initializeLayoutChildren: function(children){
                for(var i = 0; i < children.length; i++){
                    this.addChild(children[i]);
                }

            },
            _renderChild: function(child){
                this.callBase();
                if(child instanceof Content){
                    var ref = child.get('ref');
                    if(ref){
                        var placeHolder = this.getPlaceholder(ref);
                        if(placeHolder){
                            placeHolder.set({content: child});
                        }
                    }
                }
            },
            _renderComponentClass:function (cls,oldCls) {
                if (oldCls) {
                    this.removeClass(oldCls);
                }
                if (cls) {
                    this.addClass(cls);
                }
            },
            _renderClass: function(className){
                if(className){
                    this.addClass(className);
                }

            },
            _renderTemplateToPlaceHolder:function (templateName, placeholderName, attributes) {
                this.$renderedPlaceholders = this.$renderedPlaceholders || {};
                var renderedComponent = this.$renderedPlaceholders[placeholderName];
                if (!renderedComponent) {
                    var template = this.getTemplate(templateName);
                    if (template) {
                        // TODO: maybe render all components returned
                        // or create special method createComponent
                        renderedComponent = template.createComponents(attributes)[0];
                        // renderedComponent._initialize();
                        var placeholder = this.getPlaceholder(placeholderName);
                        if (placeholder) {
                            placeholder.set({content:renderedComponent});
                            this.$renderedPlaceholders[placeholderName] = renderedComponent;
                        } else{
                            // throw "No placeholder '"+placeholderName+"' found";
                        }

                    }
                } else {
                    renderedComponent.set(attributes);
                }

            }
        });
    }
);