define(["js/html/HtmlElement", "js/core/Bus", "js/core/WindowManager", "js/core/ExternalInterface"], function (HtmlElement, Bus, WindowManager, ExternalInterface) {

    var browserClassMap = {
        "hasTouch" : ["touch","no-touch"],
        "supportsTransition" : ["transition","no-transition"],
        "isMobile" : ["mobile","desktop"]
    };

    return HtmlElement.inherit("js.core.Stage", {
        $containerOrder: {
            'windows' : 0,
            'popups': 1,
            'tooltips' : 2
        },

        defaults: {
            tagName: "div",
            componentClass: 'stage'
        },

        ctor: function(requireJsContext, applicationContext, document, window){

            this.$requirejsContext = requireJsContext;
            this.$applicationContext = applicationContext;
            this.$applicationFactory = null;
            this.$document = document;
            this.$window = window;
            this.$bus = new Bus(this);
            this.$externalInterface = new ExternalInterface(this);

            this.$containers = {};
            this.$elements = {};

            this.callBase(null, false, this, null, this);

            this.$browser = this._createBrowserObject();

            this._annotateBrowserInformation(this.$browser);
        },

        _createBrowserObject: function() {

            var browser = {};

            browser.isBrowser = this.runsInBrowser();

            if (this.runsInBrowser()) {
                var window = this.$window;


                browser.hasTouch = "ontouchend" in window;
                browser.has3D = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
                browser.msPointerEnabled = "msPointerEnabled" in window.navigator;

                var navigator = window.navigator;

                if (navigator) {

                    var userAgent = navigator.userAgent || navigator.appVersion;
                    var mobile = /(iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm)/i.exec(userAgent);
                    browser.isMobile = !!mobile;
                    browser.isIOS = !!userAgent.match(/(iPad|iPhone|iPod)/g);

                    if (mobile) {
                        browser.mobileType = mobile[1].toLowerCase();
                    }

                    var os = /win|mac|linux|x11/i.exec(userAgent);
                    if (os) {
                        os = {
                            win: "windows",
                            mac: "mac",
                            linux: "linux",
                            x11: "unix"
                        }[os[0].toLowerCase()];

                        browser.os = os;
                    }

                    var browserName = /firefox|chrome|safari/i.exec(userAgent);
                    if (browserName) {
                        browserName = browserName[0].toLowerCase();
                        browser.name = browserName;
                    }

                    browserName = /msie\s(\d+)/i.exec(userAgent);
                    if (browserName) {
                        browserName = "ie ie" + browserName[1];
                        browser.name = browserName;
                    }

                }

                var s = window.document.createElement('div').style;

                browser.supportsTransition = 'transition' in s ||
                    'WebkitTransition' in s ||
                    'MozTransition' in s ||
                    'msTransition' in s ||
                    'OTransition' in s;
            }

            return browser;

        },

        _annotateBrowserInformation: function(browser){
            var classes = ["stage"], value;
            for(var key in browser){
                if(browser.hasOwnProperty(key)){
                    value = browser[key];
                    if(typeof(value) === "boolean"){
                        if(browserClassMap.hasOwnProperty(key)){
                            classes.push(browserClassMap[key][value ? 0 : 1]);
                        }
                    } else {
                        classes.push(value);
                    }
                }
            }
            this.set('componentClass', classes.join(" "));
        },

        createChildren: function() {

            this.$windowManager = this.createComponent(WindowManager);
            return [this.$windowManager];

        },

        render: function(target){
            var dom = this.callBase(null);

            if (this.$externalInterface) {
                this.$externalInterface._stageRendered(dom);
            }

            if (target) {
                target.appendChild(dom);
                this.rendered = true;
                this.$bus.trigger('Stage.Rendered', target);
                this.trigger('add:dom', target);
            }
            return dom;
        },
        createWindow: function(elementId){
            return this.createHtmlElement(elementId,"windows");
        },
        createTooltip: function(tooltipId){
            return this.createHtmlElement(tooltipId, "tooltips");
        },
        createHtmlElement: function(elementId, containerId){
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