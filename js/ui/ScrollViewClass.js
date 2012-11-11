define(['js/ui/View'], function(View) {

    var AUTO = "AUTO";

    return View.inherit('js.ui.ScrollViewClass', {
        $defaultContentName: "content",

        defaults: {
            verticalScroll: true,
            horizontalScroll: true,
            lockScrollDirection: true,

            enableScroll: AUTO,
            enableTouch: AUTO,

            scrollTop: 0,
            scrollLeft: 0,

            denyOutsideScroll: false,
            syncToScrollPosition: false,

            // TODO: read from content, provide refresh method
            scrollContainerHeight: 1116
        },

        ctor: function() {
            this.callBase();

            this._initializeCapabilities(this.$stage.$window);
        },

        _initializeCapabilities: function(window) {
            // TODO: implement browser unspecific version http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support

            var runsInBrowser = this.runsInBrowser();

            this.has3d = runsInBrowser && ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
            this.hasTouch = runsInBrowser && ('ontouchstart' in window);
            this.$translateOpen = 'translate' + (this.has3d ? '3d(' : '(');
            this.$translateClose = this.has3d ? ',0)' : ')';

        },

        _initializeRenderer: function(el) {
            this.$transformProperty = this._getTransformProperty(el);
        },

        _getTransformProperty: function (element) {
            // Note that in some versions of IE9 it is critical that
            // msTransform appear in this list before MozTransform
            var properties = [
                'transform',
                'WebkitTransform',
                'msTransform',
                'MozTransform',
                'OTransform'
            ];

            var p;
            while (p = properties.shift()) {
                if (typeof element.style[p] !== 'undefined') {
                    return p;
                }
            }
        },

        _setPosition: function(x, y) {

            this.$x = x;
            this.$y = y;

            if (this.$transformProperty && this.$.container) {
                this.$.container.$el.style[this.$transformProperty] = this.$translateOpen + x + 'px,' + y + 'px' + this.$translateClose;
            }

        },

        _commitScrollTop: function(top) {
            this._setPosition(this.$x, top);
        },

        _commitScrollLeft: function (left) {
            this._setPosition(left, this.$y);
        },

        _render: function() {
            this.callBase();

            this._setPosition(0, 0);
        },

        _renderAttribute: function() {
            this.callBase();
        },

        _isDOMNodeAttribute: function(attr) {
            return attr != "scrollTop" && attr != "scrollLeft" && this.callBase();
        },

        _bindDomEvents: function(el) {
            var self = this;

            this.callBase();

            if (this.$.enableScroll) {
                "onDOMMouseScroll" in el && this.bindDomEvent("DOMMouseScroll", onWheel);
                "onmousewheel" in el && this.bindDomEvent("mousewheel", onWheel);
            }

            // TODO: handle touch

            function onWheel(e) {
                e = e || window.event; // for IE

                var deltaX = 0,
                    deltaY = 0;

                // check target and scroll
                if (e.wheelDeltaX || e.wheelDeltaY) {
                    if (e.wheelDeltaX) {
                        deltaX = e.wheelDeltaX;
                    }

                    if (e.wheelDeltaY) {
                        deltaY = e.wheelDeltaY;
                    }
                } else {
                    var delta = e.detail ? e.detail * (-3) : e.wheelDelta;

                    if (e.axis && e.axis == 1) {
                        deltaX = delta;
                    } else {
                        deltaY = delta;
                    }
                }

                var scrollVertical = self.$.verticalScroll === true;
                var scrollHorizontal = self.$.horizontalScroll === true;

                if (self.$.lockScrollDirection && scrollVertical && scrollHorizontal) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        scrollVertical = false;
                    } else {
                        scrollHorizontal = false;
                    }
                }

                var scrolled = false;

                if (scrollVertical) {
                    var oldY = self.$y;
                    var y = oldY + Math.floor(deltaY);

                    // TODO: check ranges
                    // y = Math.min(Math.max(self.$.scrollContainerHeight + self.$.height, y), 0);

                    if (oldY != y) {
                        scrolled = true;
                        self._setPosition(self.$x, y);
                    }

                }

//                if (scrollHorizontal) {
//
//                    var oldLeft = scrollContainer.position().left;
//
//                    var left = oldLeft + Math.floor(deltaX);
//                    left = Math.min(Math.max(-scrollContainer.outerWidth() + self.$el.width(), left), 0);
//
//                    if (oldLeft != left) {
//                        scrolled = true;
//
//                        scrollContainer.css({
//                            left: left + "px"
//                        });
//                    }
//
//                }

                if (scrolled) {
                    e.preventDefault();
                }


            }

        }

    });
});