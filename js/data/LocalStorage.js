define(['js/core/Component'], function(Component) {

    /***
     * Local Storage implementation
     */
    return Component.inherit('js.data.LocalStorage', {
        ctor: function(){
            this.callBase();
            var window = this.$stage.$window, document = this.$stage.$document;
            if(window.localStorage){
                this.$localStorage = window.localStorage;
            }else{
                this.$localStorage = {
                    getItem: function (sKey) {
                        if (!sKey || !this.hasOwnProperty(sKey)) {
                            return null;
                        }
                        return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
                    },
                    key: function (nKeyId) {
                        return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
                    },
                    setItem: function (sKey, sValue) {
                        if (!sKey) {
                            return;
                        }
                        document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
                        this.length = document.cookie.match(/\=/g).length;
                    },
                    length: 0,
                    removeItem: function (sKey) {
                        if (!sKey || !this.hasOwnProperty(sKey)) {
                            return;
                        }
                        document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
                        this.length--;
                    },
                    hasOwnProperty: function (sKey) {
                        return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
                    }
                };
                this.$localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;
            }

        },
        getItem: function(key){
            return this.$localStorage.getItem(key);
        },
        setItem: function(key, value){
            this.$localStorage.setItem(key,value);
        },
        removeItem: function(key){
            this.$localStorage.removeItem(key);
        }
    });

});