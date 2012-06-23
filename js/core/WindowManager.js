define(['js/html/HtmlElement', 'underscore'], function(HtmlElement, _){

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


        show: function(window, callback, modal) {

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
                    class: 'back-drop'
                }));

                child.addChild(window);
            }

            this.addChild(child);
            list.push(window);

            var closeHandler = function(e) {
                self.removeChild(child);
                list.splice(_.indexOf(list, window), 1);

                window.unbind('close', closeHandler);

                if (callback) {
                    callback(null, window, e.$);
                }
            };

            window.bind('close', closeHandler, this);
        }

    });

});