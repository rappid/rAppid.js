define(["js/core/Component", "moment"], function (Component, moment) {
    return Component.inherit("js.core.DateFormatter", {
        defaults: {
            /**
             * The default locale
             *
             * @type String
             */
            locale: null
        },


        /***
         * Formats a date value to the given format
         *
         * @param {Date|Number} value - the value to format
         * @param {String} [value] -  the format
         */
        f: function (value, format) {

            if (value instanceof Date) {
                format = format || "LLL";
                return moment(value).format(format);
            } else if (value instanceof moment) {
                format = format || "LLL";
                return value.format(format);
            }

            return value;
        }.on("localeChanged")
    });
});