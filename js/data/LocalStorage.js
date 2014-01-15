define(['js/core/Component' , 'inherit'], function (Component, inherit) {

    /***
     * Local Storage implementation
     */
    var LocalStorage = Component.inherit('js.data.LocalStorage', {


        ctor: function () {

            this.$implementation = null;
            this.callBase();

            if (this.runsInBrowser()) {
                var window = this.$stage.$window,
                    document = this.$stage.$document;

                if ("localStorage" in window) {
                    try {
                        this.$implementation = window.localStorage;
                    } catch (e) {
                        typeof console !== "undefined" && console.log(e);
                    }
                }

                this.$implementation = this.$implementation || new LocalStorage.CookieImplementation(document);

            } else {
                this.$implementation = new LocalStorage.ObjectImplementation();
            }
        },

        getItem: function (key) {
            return this.$implementation.getItem(key);
        },

        setItem: function (key, value) {
            this.$implementation.setItem(key, value);
        },

        removeItem: function (key) {
            this.$implementation.removeItem(key);
        },

        clear: function() {
            this.$implementation.clear();
        }

    });

    // TODO: implement length as getter

    LocalStorage.CookieImplementation = inherit({

        getItem: function (sKey) {
            if (!sKey || !this.hasOwnProperty(sKey)) {
                return null;
            }
            return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },

        key: function (nKeyId) {
            return unescape(document.cookie.replace(/\s*=(?:.(?!;))*$/, "").split(/\s*=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
        },

        setItem: function (sKey, sValue) {
            if (!sKey) {
                return;
            }
            document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
            this.length = document.cookie.match(/=/g).length;
        },

        length: 0,

        size: function() {
            this.$implementation.length = document.cookie.match(/=/g).length;
        },

        removeItem: function (sKey) {
            if (!sKey || !this.hasOwnProperty(sKey)) {
                return;
            }
            document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            this.length--;
        }
//        ,
//        hasOwnProperty: function (sKey) {
//            return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
//        }
    });

    // TODO: implement length as getter

    LocalStorage.ObjectImplementation = inherit({

        ctor: function() {
            this.clear();
        },

        getItem: function (key) {
            return this.$storage[key];
        },

        setItem: function (key, value) {
            this.$storage[key] = value;
        },

        removeItem: function (key) {
            delete this.$storage[key];
        },

        clear: function() {
            this.$storage = {};
        }
    });

    return LocalStorage;

});