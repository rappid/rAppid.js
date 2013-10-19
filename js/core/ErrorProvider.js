define(["js/core/Component"], function (Component) {

    return Component.inherit('js.core.ErrorProvider', {
        defaults: {
            i18n: null,
            scope: "error"
        },

        getErrorMessage: function (error) {

            if (!error) {
                return null;
            }

            if (this.$.i18n) {
                return this.$.i18n.ts(this.$.scope, error.$.code, error.$.field) || error.$.message || error;
            } else {
                return error.$.message || error;
            }
        }

    });

});