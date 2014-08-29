define(["js/core/Window"], function (Window) {

    return Window.inherit("js.ui.DialogClass", {
        $defaultContentName: "body",

        defaults: {
            title: '',
            closable: true,
            size: "normal",
            tabindex: -1,
            componentClass: "dialog {size} {name}",
            name: ""
        },

        events: [
            "on:closeButton"
        ],

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

                    if(e.target !== self.$el){
                        return;
                    }

                    var keyHandlerName = self.$keyHandlers[e.keyCode];
                    if (keyHandlerName && self[keyHandlerName]) {
                        self[keyHandlerName].call(self, e);
                        e.stopPropagation();
                        return false;
                    }
                };
            }

            this.callBase();

            if(this.isRendered()){
                this.bindDomEvent('keydown', this._keyDownHandler);
            }
        },

        close: function () {
            if (this._keyDownHandler && this.isRendered()) {
                this.unbindDomEvent('keydown', this._keyDownHandler);
            }
            this.callBase();
        },

        /***
         * default function invoked when ESC is pressed
         * @param e
         */
        closeDialog: function (e) {
            this.trigger("on:closeButton");
            this.close();
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