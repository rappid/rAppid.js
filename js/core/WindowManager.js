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
                list = modal ? this.$windows : this.$modalWindows;

            this.addChild(window);
            list.push(window);

            var closeHandler = function(e) {
                self.removeChild(window);
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