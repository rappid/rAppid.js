define(["js/html/HtmlElement", "js/core/Bus", "js/core/WindowManager"], function (HtmlElement, Bus, WindowManager) {
    return HtmlElement.inherit("js.core.Stage", {
        $containerOrder: {
            'windows' : 0,
            'popups': 1,
            'tooltips' : 2
        },

        defaults: {
            tagName: "div",
            'class': 'stage'
        },

        ctor: function(requireJsContext, applicationContext, document, window){

            this.$requirejsContext = requireJsContext;
            this.$applicationContext = applicationContext;
            this.$applicationFactory = null;
            this.$document = document;
            this.$window = window;
            this.$bus = new Bus();

            this.$containers = {};
            this.$elements = {};

            this.callBase(null, false, this, null, this);

        },

        createChildren: function() {

            this.$windowManager = this.createComponent(WindowManager);
            return [this.$windowManager];

        },

        render: function(target){
            var dom = this.callBase(null);
            if (target) {
                target.appendChild(dom);
                this.trigger('add:dom', target);
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
            return this.$stage.$applicationContext.createInstance(HtmlElement, [attributes, null, this.$stage, this, this]);
        }

    });
});