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
            'class': 'window-manager'
        },

        /***
         * Adds a window to the WindowManager and shows it
         * @param {js.core.Window} window - window instance to show
         * @param {Function} [windowCloseCallback] - callback function invoked after the window the is closed
         * @param {Boolean} [modal=false] - if true a modal window in front of all other windows will be shown
         */
        show: function(window, windowCloseCallback, modal) {

            var self = this,
                list = modal ? this.$windows : this.$modalWindows,
                child = window;

            if (modal) {
                child = this.createComponent(HtmlElement, {
                    tagName: 'div',
                    componentClass: 'modal'
                });

                child.addChild(this.createComponent(HtmlElement, {
                    tagName: 'div',
                    'class': 'modal-backdrop back-drop'
                }));

                child.addChild(window);

                window.set('componentClass', 'modal window');
            }

            this.addChild(child);
            list.push(window);

            var closeHandler = function(e) {
                self.removeChild(child);
                list.splice(_.indexOf(list, window), 1);

                window.unbind('close', closeHandler);

                if (windowCloseCallback) {
                    windowCloseCallback(null, window, e.$);
                }
            };

            window.bind('close', closeHandler, this);
        }

    });

});