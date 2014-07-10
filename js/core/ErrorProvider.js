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
                var p = [error.$.code],
                    s = this.$.scope;
                if (s) {
                    p.unshift(s);
                }
                if (error.$.field) {
                    p.push(error.$.field);
                }
                return this.$.i18n.t(p.join(".")) || error.$.message || error;
            } else {
                return error.$.message || error;
            }
        }

    });

});