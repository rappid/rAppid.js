define(['js/html/HtmlElement', 'underscore'], function(HtmlElement, _){

    /***
     * The WindowManager manages Windows on the Stage.
     *
     * @see js.core.Stage
     */
    return HtmlElement.inherit('js.core.WindowManager', {

        ctor: function() {

            this.$windows = [];
            this.$modalWindows = [];

            this.callBase();
        },

        defaults: {
            tagName: 'div',
            'class': 'window-manager {modalActiveClass()} {activeModalsClasses()}'
        },

        modalActiveClass: function() {
            return this.$modalWindows.length > 0 ? "modal-active" : "";
        }.on("modalStateChanged"),

        activeModalsClasses: function() {

            var ret = [];

            for (var i = 0; i < this.$modalWindows.length; i++) {
                var modal = this.$modalWindows[i];

                if (modal && modal.$.name) {
                    ret.push(modal.$.name + "-active");
                }

            }

            return ret.join(" ");

        }.on("modalStateChanged"),

        /***
         * Adds a window to the WindowManager and shows it
         * @param {js.core.Window} window - window instance to show
         * @param {Function} [windowCloseCallback] - callback function invoked after the window the is closed
         * @param {Boolean} [modal=false] - if true a modal window in front of all other windows will be shown
         */
        show: function(window, windowCloseCallback, modal) {

            var self = this,
                list = modal ? this.$modalWindows : this.$windows,
                child = window;

            if (modal) {
                child = this.createComponent(HtmlElement, {
                    tagName: 'div',
                    componentClass: 'modal'
                });

                var backdrop = this.createComponent(HtmlElement, {
                    tagName: 'div',
                    'class': 'modal-backdrop back-drop'
                });

                child.addChild(backdrop);

                backdrop.bind("on:pointer", function () {
                    window.trigger("on:backdropClick");
                });

                child.addChild(window);

                window.set('windowClass', 'modal window');

            }

            this.addChild(child);
            list.push(window);

            if (modal) {
                this.trigger("modalStateChanged");
            }

            var closeHandler = function(e) {
                self.removeChild(child);
                list.splice(_.indexOf(list, window), 1);

                window.unbind('close', closeHandler);
                self.trigger("modalStateChanged");

                if (windowCloseCallback) {
                    windowCloseCallback(null, window, e.$);
                }
            };

            window.bind('close', closeHandler, this);
        }

    });

});