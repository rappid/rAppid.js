define(['js/html/HtmlElement', 'underscore'], function(HtmlElement, _){

    return HtmlElement.inherit('js.core.WindowManager', {

        ctor: function() {

            this.$windows = [];
            this.$modalWindows = [];

            this.callBase();
        },

        defaults: {
            tagName: 'div'
        },

        createChildren: function() {

            this.$windowContainer = this.createComponent(HtmlElement, {
                tagName: 'div'
            });
            this.$modalWindowContainer = this.createComponent(HtmlElement, {
                tagName: 'div'
            });

            return [this.$windowContainer, this.$modalWindowContainer];

        },

        show: function(window, callback, modal) {

            var container = modal ? this.$modalWindowContainer : this.$windowContainer,
                list = modal ? this.$windows : this.$modalWindows;

            container.addChild(window);
            list.push(window);

            var closeHandler = function(e) {
                container.removeChild(window);
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