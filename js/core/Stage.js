define(["js/html/HtmlElement", "js/core/Bus", "js/core/WindowManager", "js/core/ExternalInterface", "js/core/ErrorProvider"], function (HtmlElement, Bus, WindowManager, ExternalInterface, ErrorProvider) {

    var browserClassMap = {
        "hasTouch": ["touch", "no-touch"],
        "supportsTransition": ["transition", "no-transition"],
        "isMobile": ["mobile", "desktop"],
        "supportViewPortRelativeSize": ["vs-support", "no-vs-support"]
    };

    /***
     * @summary The stage is the main container for each application.
     * It contains all root HTML elements like windows, tooltips or popups.
     * Usually an application is one window on the stage.
     *
     */
    return HtmlElement.inherit("js.core.Stage", {
        $containerOrder: {
            'windows': 0,
            'popups': 1,
            'tooltips': 2
        },

        defaults: {
            tagName: "div",
            componentClass: 'stage'
        },

        ctor: function (requireJsContext, applicationContext, document, window) {

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

        _addInjectionFactories: function (injection) {
            injection.addFactory({
                type: "js.core.ErrorProvider",
                factory: ErrorProvider,
                singleton: true
            });
        },

        /**
         * Creates the browser object with the following information
         *
         * * isBrowser - false if runs on node
         * * hasTouch - true if touchend in window
         * * has3D - true if  'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()
         * * msPointerEnabled - true if  "msPointerEnabled" in window.navigator
         * * isMobile - true if userAgent is iphone, ipad, ipod blackberry, palm etc..
         * * isIOS - true if iPad, iPhone or iPod
         * * mobileType - the name of the mobile device
         * * os - the name of the operating system (windows, mac, linux, unix)
         * * name -  the name of the browser (safari, firefox, ie, chrome)
         * * supportsTransition
         *
         * @returns {Object}
         * @private
         */
        _createBrowserObject: function () {

            function getVendorPrefix() {
                if ('WebkitTransition' in s) return "webkit";
                if ('MozTransition' in s) return "Moz";
                if ('msTransition' in s) return "MS";
                if ('OTransition' in s) return "o";
                return "";
            }

            var browser = {};

            browser.isBrowser = this.runsInBrowser();

            if (this.runsInBrowser()) {
                var window = this.$window,
                    document = this.$document,
                    body = document.body || document.getElementsByTagName("body")[0],
                    navigator, s;

                if (window) {
                    browser.hasTouch = "ontouchend" in window;
                    browser.has3D = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
                    browser.msPointerEnabled = "msPointerEnabled" in window.navigator;

                    navigator = window.navigator;

                    var div = document.createElement("div");
                    div.setAttribute("style", "position: absolute; height: 100vh; width: 100vw;");
                    body.appendChild(div);

                    browser.supportViewPortRelativeSize = (window.innerWidth === div.offsetWidth);

                    body.removeChild(div);


                    s = window.document.createElement('div').style;
                }


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
                    }

                    browser.os = os || "";

                    var browserName = /(firefox)|(chrome)|(safari)/i.exec(userAgent);
                    if (browserName) {
                        browser.isFF = !!browserName[1];
                        browser.isChrome = !!browserName[2];
                        browser.isSafari = !!browserName[3];
                        browserName = browserName[0].toLowerCase();
                        browser.name = browserName;
                    }

                    browserName = /msie\s(\d+)/i.exec(userAgent);
                    if (browserName) {
                        browserName = "ie ie" + browserName[1];
                        browser.name = browserName;
                        browser.isIE = true;
                    } else if ("ActiveXObject" in window) {
                        browser.isIE = true;
                        browser.name = "ie ie11";
                    } else {
                        browser.isIE = false;
                    }

                    browser.name = browser.name || "";

                    var version = /(?:opera|chrome|safari|firefox|msie|trident)\/?\s*([\d]+)/i.exec(userAgent);
                    if (version && version [1]) {
                        browser.version = version[1];
                    }
                }


                if (s) {
                    browser.supportsTransition = 'transition' in s ||
                        'WebkitTransition' in s ||
                        'MozTransition' in s ||
                        'msTransition' in s ||
                        'OTransition' in s;

                    browser.vendorPrefix = getVendorPrefix();
                }

            }

            return browser;

        },
        /***
         * Goes through the browser object and adds classes for each entry to
         * the rendered stage element
         *
         * @param {Object} browser
         * @private
         */
        _annotateBrowserInformation: function (browser) {
            var classes = ["stage"], value;

            for (var key in browser) {
                if (browser.hasOwnProperty(key)) {

                    value = browser[key];

                    if (typeof(value) === "boolean") {
                        if (browserClassMap.hasOwnProperty(key)) {
                            classes.push(browserClassMap[key][value ? 0 : 1]);
                        } else if (key === 'isIOS' && value) {
                            classes.push('ios');
                            classes.push('ios' + this._getIOSVersion());
                        }
                    } else {
                        if (key === 'version') {
                            classes.push(browser.name + value);
                        } else {
                            classes.push(value);
                        }
                    }
                }
            }

            this.set('componentClass', classes.join(" "));
        },

        _getIOSVersion: function () {
            var iOSVersionRegexp = this.$window.navigator.userAgent.match(/OS ([0-9]+)(?:_[0-9])* like Mac OS/);

            if (iOSVersionRegexp && iOSVersionRegexp.length > 0) {
                return (iOSVersionRegexp[1]);
            } else {
                return '';
            }
        },

        /**
         * Creates one WindowManager as additional child
         *
         * @returns {Array}
         */
        createChildren: function () {

            this.$windowManager = this.createComponent(WindowManager);
            return [this.$windowManager];

        },
        /***
         * Renders into the given target
         *
         * @param {HTMLElement} target - the render target
         * @returns {HTMLElement}
         */
        render: function (target) {
            var dom = this.callBase(null);

            if (this.$externalInterface) {
                this.$externalInterface._stageRendered(dom);
            }

            if (target) {
                target.appendChild(dom);
                this.rendered = true;
                this.$bus.trigger('Stage.Rendered', target);
                this.trigger('dom:add', target);
            }
            return dom;
        },
        /***
         * Creates a window with an ID
         *
         * @param elementId
         * @returns {*}
         */
        createWindow: function (elementId) {
            return this.createHtmlElement(elementId, "windows");
        },
        /**
         * Creates a tooltip window for the stage with an ID
         *
         * @param tooltipId
         * @returns {*}
         */
        createTooltip: function (tooltipId) {
            return this.createHtmlElement(tooltipId, "tooltips");
        },
        /***
         * Creates an HTML element with inside a container with class {container-id}-container and
         * caches it with element and container id
         *
         * @param {String} elementId
         * @param {String} containerId
         * @returns {HTMLElement}
         */
        createHtmlElement: function (elementId, containerId) {
            var container = this.$containers[containerId];
            if (!container) {
                // TODO: remove this shit
                container = this.createContainer({'class': containerId + "-container"});
                this.$containers[containerId] = container;
                this.addChild(container);
                if (this.$containerOrder[containerId]) {
                    container.setChildIndex(this.$containerOrder[containerId]);
                }
            }

            var element = this.$elements[containerId + "_" + elementId];
            if (!element) {
                element = this.createContainer({});
                container.addChild(element);
            }

            return element.$el;
        },
        /***
         * Creates a container with a set of attributes
         *
         * @param {Object} attributes - the attribute set
         * @returns {js.core.HtmlElement}
         */
        createContainer: function (attributes) {
            attributes = attributes || {};
            return this.$stage.$applicationContext.createInstance(HtmlElement, [attributes, null, this.$stage, this, this]);
        },

        destroy: function () {
            this.callBase();

            this.$requirejsContext = null;
            this.$applicationContext = null;
            this.$applicationFactory = null;
            this.$document = null;
            this.$window = null;
            this.$bus = null;
            this.$externalInterface = null;

            this.$containers = null;
            this.$elements = null;

            this.$browser = null;

            this.$application.destroy();
        }

    });
});