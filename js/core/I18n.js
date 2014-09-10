define(["require", "js/core/Component", "underscore", "flow"], function (require, Component, _, flow) {
    return Component.inherit("js.core.I18n", {
        defaults: {
            /***
             * @type String
             */
            path: 'app/locale',
            /**
             * The default locale
             *
             * @type String
             */
            locale: null,
            /***
             * The suffix of the locale file
             *
             * @type String
             */
            suffix: '.json',
            /**
             * An object with all translations read from the locale file
             * @type Object
             */
            translations: {},

            /***
             * determinate if the locale will be loaded automatically during initialization
             */
            loadLocaleDuringInitialization: true
        },

        /***
         * Inside the initialize method loadLocale is called
         */
        initialize: function () {
            this.callBase();

            this.$.loadLocaleDuringInitialization && this.loadLocale(this.$.locale);
        },
        _commitChangedAttributes: function (attributes) {
            if (attributes.locale) {
                this.loadLocale(attributes.locale);
            }
        },
        /***
         * Loads the given locale and calls the callback
         *
         * @param {String} locale
         * @param {Function} callback
         */
        loadLocale: function (locale, callback) {

            var self = this;

            if (!locale) {
                callback && callback("locale not defined");
                return;
            }

            require(['json!' + self.$.path + '/' + self.$.locale], function (translations) {
                self.set({
                    translations: translations
                });
                callback && callback();
            }, function (err) {
                self.log(err, 'error');
                callback && callback(err);
            });

        },

        /**
         * Translates a key with the given arguments.
         *
         * @param {Number} [num] for plural or singular
         * @param {String} key translation key
         * @param {String|Number} replacement1 - replacement for %0
         * @param {String|Number} replacement2 - replacement for %1 ...
         */
        t: function (num, key, replacement1, replacement2) {

            var args = Array.prototype.slice.call(arguments), isPlural;
            key = args.shift();
            if (_.isNumber(key)) {
                isPlural = (key !== 1);
                key = args.shift();
            }
            if (isPlural) {
                key += "_plural";
            }

            try {
                var value = this.$.translations[key] || this.get(this.$.translations, key) || "";
            } catch (e) {
                this.log("translation key '" + key + "' is not valid", "error");
            }


            for (var i = 0; i < args.length; i++) {
                // replace, placeholder
                value = value.split("%" + i).join(args[i] || "");
            }

            return value;
        }.onChange("translations"),
        /***
         * Does the same as the "t" method but joins two key fragments: key1+"."+key2
         *
         * @param {String} key1 - key fragment 1
         * @param {String} key2 - key fragment 2
         * @param {String} replacement1 - to replace %0
         * @param {String} replacement2 - to replace %1
         */
        ts: function (key1, key2, replacement1, replacement2) {
            var args = Array.prototype.slice.call(arguments),
                newArgs,
                key = args.shift(),
                num;

            if (!args.length || args[0] == null) {
                return "";
            }

            if (_.isNumber(key)) {
                num = key;
                key = args.shift();
            }

            var add = args.shift();
            if (add) {
                // key = scope + "." + key
                key += "." + add;
            }

            newArgs = num ? [num] : [];
            newArgs.push(key);
            newArgs = newArgs.concat(args);

            return this.t.apply(this, newArgs);

        }.onChange("translations")

    });
});