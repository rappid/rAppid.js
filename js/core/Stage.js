define(["js/html/HtmlElement", "js/core/UIComponent"], function (HtmlElement, UIComponent) {
    return HtmlElement.inherit("js.core.Stage", {
        $containerOrder: {
            'windows' : 0,
            'popups': 1,
            'tooltips' : 2
        },
        defaults: {
            tagName: "div"
        },
        ctor: function(){
            this.$containers = {};
            this.$elements = {};
            this.callBase();

        },
        render: function(target){
            var dom = this.callBase(null);
            if (target) {
                target.appendChild(dom);
            }
            return dom;
        },
        createWindow: function(elementId){
            return this.createHtmlElemnet(elementId,"windows");
        },
        createTooltip: function(tooltipId){
            return this.createHtmlElemnet(tooltipId, "tooltips");
        },
        createHtmlElemnet: function(elementId, containerId){
            var container = this.$containers[containerId];
            if(!container){
                // TODO: remove this shit
                container = this.createContainer({'class' : containerId + "-container"});
                this.$containers[containerId] = container;
                this.addChild(container);
                if(this.$containerOrder[containerId]){
                    container.setChildIndex(this.$containerOrder[containerId]);
                }
            }

            var element = this.$elements[containerId + "_" + elementId];
            if(!element){
                element = this.createContainer({});
                container.addChild(element);
            }

            return element.$el;
        },
        createContainer: function(attributes){
            attributes = attributes || {};
            return this.$systemManager.$applicationContext.createInstance(UIComponent, [attributes, null, this.$systemManager, this, this]);
        }

    });
});