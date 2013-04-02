define(["require", "js/core/Component", "underscore", "moment", "flow"], function (require, Component, _, moment, flow) {
    return Component.inherit("js.core.I18n", {
        defaults: {
            path: 'app/locale',
            locale: null,
            suffix: '.json',
            translations: {},
            loadMomentJs: true
        },

        initialize: function () {
            this.callBase();
            this.loadLocale(this.$.locale);
        },

        _commitChangedAttributes: function (attributes) {
            if (attributes.locale) {
                this.loadLocale(attributes.locale);
            }
        },

        loadLocale: function (locale, callback) {

            var self = this;

            if (!locale) {
                callback && callback("locale not defined");
                return;
            }

            flow()
                .par(function (cb) {
                    require(['json!' + self.$.path + '/' + self.$.locale], function (translations) {
                        self.set({
                            translations: translations
                        });
                        cb();
                    }, function(err) {
                        self.log(err, 'error');
                        cb();
                    });
                }, function (cb) {
                    if (self.$.loadMomentJs) {
                        require([self.$.path + "/" + self.$.locale], function () {
                            self.trigger("localeChanged");
                            cb();
                        }, function (err) {
                            self.log(err, 'error');
                            cb();
                        });
                    } else {
                        cb();
                    }
                })
                .exec(callback);


        },

        /**
         * @param [num] for plural or singular
         * @param key translation key
         * @param - replacement for %0
         * @param - replacement for %1 ...
         */
        t: function () {

            var args = Array.prototype.slice.call(arguments);
            var key = args.shift(), isPlural;
            if (_.isNumber(key)) {
                isPlural = (key !== 1);
                key = args.shift();
            }
            if (isPlural) {
                key += "_plural";
            }

            var value = this.$.translations[key] || this.get(this.$.translations, key) || "";

            for (var i = 0; i < args.length; i++) {
                // replace, placeholder
                value = value.split("%" + i).join(args[i]);
            }

            return value;
        }.onChange("translations"),

        ts: function() {
            var args = Array.prototype.slice.call(arguments),
                newArgs = [],
                key = args.shift(),
                num;

            if (_.isNumber(key)) {
                num = key;
                key = args.shift();
            }

            // key = scope + "." + key
            key += "." + args.shift();

            newArgs = num ? [num] : [];
            newArgs.push(key);
            newArgs = newArgs.concat(args);

            return this.t.apply(this, newArgs);

        }.onChange("translations"),

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