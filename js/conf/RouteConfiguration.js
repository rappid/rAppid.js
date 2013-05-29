define(["js/conf/Configuration"], function (Configuration) {
    return Configuration.inherit("js.conf.RouteConfiguration", {

        defaults: {
            /***
             * the name of the route. The name is just used for easier debugging reasons.
             * @type String
             */
            name: null,

            /***
             * a regular expression defining the route for matching the fragment. The starting #/ fragment is stripped from
             * the fragment.
             *
             * Each matching group is provided in the `onexec` event handler as parameter. The first matching group will become the
             * second parameter as the first parameter of the event handler is always the routeContext.
             *
             * @type RegExp
             * @required
             */
            route: null
        },

        events: [
        /***
         * the exec event is dispatched if the route matches the fragment. The event handler is invoked with the routeContext as
         * first parameter followed by parameters for each matched group of the regular expression.
         *
         * Keep in mind to annotate the event handler function with the `async()` method annotation if you need to do asynchronous
         * code executing.
         */
            "exec"
        ]

    });
});