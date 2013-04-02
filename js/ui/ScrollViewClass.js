define(['js/ui/View'], function (View) {

    var AUTO = "auto",
        DOM_MOUSE_SCROLL = "DOMMouseScroll",
        MOUSEWHEEL = "mousewheel",
        START_EVENT, MOVE_EVENT, END_EVENT,

        NONE = 0,
        UNSPECIFIED = -1,
        VERTICAL = 1,
        HORIZONTAL = 2,
        BOTH = 4;

    return View.inherit('js.ui.ScrollViewClass', {
        $defaultContentName: "content",

        defaults: {
            verticalScroll: true,
            horizontalScroll: true,
            lockScrollDirection: true,

            enableScroll: AUTO,
            enablePointer: AUTO,

            scrollTop: 0,
            scrollLeft: 0,

            restrictScrollToContainer: false,
            syncToScrollPosition: false,

            // TODO: read from content, provide refresh method
            scrollContainerHeight: 1116
        },

        ctor: function () {

            this.callBase();

            this._initializeCapabilities(this.$stage.$window);
        },

        _initializeCapabilities: function (window) {
            // TODO: implement browser unspecific version http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support

            var runsInBrowser = this.runsInBrowser();

            this.has3d = runsInBrowser && ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
            this.hasTouch = runsInBrowser && ('ontouchstart' in window);
            this.$translateOpen = 'translate' + (this.has3d ? '3d(' : '(');
            this.$translateClose = this.has3d ? ',0)' : ')';

        },

        _commitChangedAttributes: function (attributes) {
            if (attributes.hasOwnProperty("enableScroll") || attributes.hasOwnProperty("enablePointer")) {
                this.$enableScroll = (this.$.enableScroll === AUTO && !this.hasTouch) || this.$.enableScroll;
                this.$enablePointer = (this.$.enablePointer === AUTO && this.hasTouch) || this.$.enablePointer || !this.$enableScroll;

                if (this.$enablePointer) {
                    START_EVENT = this.hasTouch ? "touchstart" : "mousedown";
                    MOVE_EVENT = this.hasTouch ? "touchmove" : "mousemove";
                    END_EVENT = this.hasTouch ? "touchend" : "mouseup";
                }

                this._registerEvents();
            }
        },

        _initializeRenderer: function (el) {
            this.$transformProperty = this._getTransformProperty(el);
            var prefix = /^(-[^-]+-)?/.exec(this.$transformProperty)[0];
            this.$translateDurationProperty = prefix + "transition-duration";
            this.$transitionTimingFunction = prefix + "transition-timing-function";

        },

        _getTransformProperty: function (element) {

            var properties = [
//                'transform',
                '-webkit-transform',
                '-ms-transform',
                'MozTransform',
                '-o-transform'
            ];

            var p;
            while (p = properties.shift()) {
                if (typeof element.style[p] !== 'undefined') {
                    return p;
                }
            }
        },

        _stopScrolling: function () {

            var matrix = this.$stage.$window.getComputedStyle(this.$.container.$el)[this.$transformProperty],
                content = /^matrix\((.*)\)$/.exec(matrix),
                values;

            if (content) {
                values = content[1].split(",");
                this._setPosition(values[4], values[5]);
            } else {
                this._setPosition(0, 0);
            }

        },

        _setPosition: function (x, y, duration) {

            y = Math.min(0, Math.max(-this.$.scrollContainerHeight + this.$.height, y));

            if (y === this.$y && x === this.$x) {
                return false;
            }

            this.$x = x;
            this.$y = y;

            if (this.$transformProperty && this.$.container) {
                duration = duration || 0;
                this.$.container.$el.style[this.$translateDurationProperty] = duration;
                this.$.container.$el.style[this.$transitionTimingFunction] = "ease-out";
                this.$.container.$el.style[this.$transformProperty] = this.$translateOpen + x + 'px,' + y + 'px' + this.$translateClose;
            }

            return true;
        },

        _commitScrollTop: function (top) {
            this._setPosition(this.$x, top);
        },

        _commitScrollLeft: function (left) {
            this._setPosition(left, this.$y);
        },

        _render: function () {
            this.callBase();

            this._setPosition(0, 0);
        },

        _renderAttribute: function () {
            this.callBase();
        },

        _isDOMNodeAttribute: function (attr) {
            return attr != "scrollTop" && attr != "scrollLeft" && this.callBase();
        },

        handleEvent: function (e) {

            switch (e.type) {
                case MOUSEWHEEL:
                case DOM_MOUSE_SCROLL:
                    this.$enableScroll && this._onWheel(e);
                    break;
                case START_EVENT:
                    this._down(e);
                    break;
                case MOVE_EVENT:
                    this._move(e);
                    break;
                case END_EVENT:
                    this._end(e);
                    break;
            }

        },

        _down: function (e) {
            if (!this.$enablePointer) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            this._stopScrolling();

            this.$pointerStartX = this.$pointerX = this.hasTouch ? e.changedTouches[0].pageX : e.pageX;
            this.$pointerStartY = this.$pointerY = this.hasTouch ? e.changedTouches[0].pageY : e.pageY;

            this.$downX = this.$x;
            this.$downY = this.$y;

            this._setPosition(this.$x, this.$y);

            this.$moveDirection = UNSPECIFIED;
            this.$pointerTime = e.timeStamp;
        },

        _move: function (e) {
            if (!(this.$enablePointer && this.$moveDirection)) {
                return;
            }

            this.$pointerX = this.hasTouch ? e.changedTouches[0].pageX : e.pageX;
            this.$pointerY = this.hasTouch ? e.changedTouches[0].pageY : e.pageY;

            var deltaX = this.$pointerX - this.$pointerStartX,
                deltaY = this.$pointerY - this.$pointerStartY;

            var scrollVertical = this.$.verticalScroll === true;
            var scrollHorizontal = this.$.horizontalScroll === true;

            if (this.$.lockScrollDirection && scrollVertical && scrollHorizontal) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    scrollVertical = false;
                } else {
                    scrollHorizontal = false;
                }
            }

            var newX = this.$downX,
                newY = this.$downY;


            if (scrollVertical) {
                newY = newY + Math.floor(deltaY);
            }

            if (scrollHorizontal) {
                newX = newX + Math.floor(deltaX);
            }

            this._setPosition(newX, newY);


            e.stopPropagation();

        },

        _end: function (e) {
            if (!(this.$enablePointer && this.$moveDirection)) {
                return false;
            }

            var a = -1.1;
            var deltaT = (e.timeStamp - this.$pointerTime) / 1000; // seconds
            var deltaY = this.$pointerStartY - this.$pointerY; // pixel
            var direction = deltaY < 0 ? 1 : -1;

            deltaY = Math.abs(deltaY);

            var v = deltaY / deltaT; // pixel / seconds

            var t = Math.abs(v / a);
            var s = a/2*t*t / 1000;

            t /= 2;
            s = Math.abs(s) * direction;

            console.log(v, s, t);
            this._setPosition(this.$x, this.$y + s, Math.round(t) + "ms");

            this.$moveDirection = NONE;
        },

        _bindDomEvents: function () {
            this.callBase();

            this._registerEvents();
        },

        _registerEvents: function () {

            var el = this.$el;
            if (!(el && this.runsInBrowser())) {
                return;
            }


            if (this.$enableScroll) {
                if (this.$scrollBound) {
                    // do not bind twice
                    return;
                }

                if (this.$stage.$document.attachEvent || "onmousewheel" in el) {
                    this.bindDomEvent(MOUSEWHEEL, this);
                } else {
                    this.bindDomEvent(DOM_MOUSE_SCROLL, this);
                }

                this.$scrollBound = true;
            } else {
                if (!this.$pointerBound) {
                    return;
                }

                if (this.$stage.$document.attachEvent || "onmousewheel" in el) {
                    this.unbindDomEvent(MOUSEWHEEL, this);
                } else {
                    this.unbindDomEvent(DOM_MOUSE_SCROLL, this);
                }

                this.$scrollBound = false;
            }

            if (this.$enablePointer) {
                if (this.$pointerBound) {
                    return;
                }

                this.bindDomEvent(START_EVENT, this);
                this.bindDomEvent(MOVE_EVENT, this);
                this.dom(this.$stage.$window).bindDomEvent(END_EVENT, this);

                this.$pointerBound = true;
            } else {
                if (!this.$pointerBound) {
                    return;
                }

                this.unbindDomEvent(START_EVENT, this);
                this.unbindDomEvent(MOVE_EVENT, this);
                this.unbindDomEvent(END_EVENT, this);

                this.$pointerBound = false;
            }

        },

        _onWheel: function (e) {
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

            var scrollVertical = this.$.verticalScroll === true;
            var scrollHorizontal = this.$.horizontalScroll === true;

            if (this.$.lockScrollDirection && scrollVertical && scrollHorizontal) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    scrollVertical = false;
                } else {
                    scrollHorizontal = false;
                }
            }

            var scrolled = false;

            if (scrollVertical) {
                var oldY = this.$y;
                var y = oldY + Math.floor(deltaY);

                scrolled = this._setPosition(this.$x, y);
            }

//                if (scrollHorizontal) {
//
//                    var oldLeft = scrollContainer.position().left;
//
//                    var left = oldLeft + Math.floor(deltaX);
//                    left = Math.min(Math.max(-scrollContainer.outerWidth() + this.$el.width(), left), 0);
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

            if (scrolled || this.$.restrictScrollToContainer) {
                e.preventDefault();
            }


        }

    });
});