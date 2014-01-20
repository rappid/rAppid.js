define(["js/conf/Configuration"], function(Configuration) {

    return Configuration.inherit("js.conf.InjectionConfiguration", {

        defaults: {

            /***
             * the type of the injection type
             * @type String
             */
            type: null,

            /***
             * the factory that will be injected. If no factory is given the
             * factory will be automatically required
             *
             * @type Function
             */
            factory: null,

            /***
             * add instance to singleton cache?
             * @type: Boolean
             */
            singleton: true
        }

    });

});