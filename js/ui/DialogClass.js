define(["js/core/Window"], function (Window) {

    return Window.inherit("js.ui.DialogClass", {
        $defaultContentName: "body",

        defaults: {
            title: '',
            closable: true,
            size: "normal",
            componentClass: "dialog {size}"
        },

        $keyHandlers: {
            27: "closeDialog",
            13: "confirmDialog"
        },

        showModal: function () {
            if (!this._keyDownHandler) {
                var self = this;
                this._keyDownHandler = function (e) {

                    if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
                        return;
                    }

                    var keyHandlerName = self.$keyHandlers[e.keyCode];
                    if (keyHandlerName && self[keyHandlerName]) {
                        self[keyHandlerName].call(self, e);
                        e.stopPropagation();
                        return false;
                    }
                }
            }
            this.$stage.$window && this.dom(this.$stage.$window).bindDomEvent('keydown', this._keyDownHandler);

            this.callBase();
        },

        close: function () {
            if (this._keyDownHandler) {
                this.$stage.$window && this.dom(this.$stage.$window).unbindDomEvent('keydown', this._keyDownHandler);
            }
            this.callBase();
        },

        /***
         * default function invoked when ESC is pressed
         * @param e
         */
        closeDialog: function (e) {
            this.close()
        },

        /***
         *
         * abstract function invoked when the enter key is pressed
         *
         * @abstract
         * @param e
         */
        confirmDialog: function (e) {
            this.close(true);
        }
    });

});