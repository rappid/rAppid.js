define(['js/html/HtmlElement'], function(HtmlElement) {

    return HtmlElement.inherit('js.core.Window', {

        defaults: {
            tagName: 'div',
            componentClass: 'window'
        },

        /***
         *
         * @param {Function} [callback]
         * @param {Boolean} [modal=false]
         */
        show: function(callback, modal) {
            this.$stage.$windowManager.show(this, callback, modal);
        },

        showModal: function(callback) {
            this.show(callback, true);
        },

        close: function(state) {
            this.trigger('close', state);
        }


    });

});