define(["js/conf/Configuration"], function (Configuration) {
    return Configuration.inherit("js.conf.ModuleConfiguration", {
        defaults: {
            /***
             * a regular expression that will activate the module if the route matches
             * @type RegExp
             */
            route: null,

            /***
             * a unique name of the module so the ModuleLoader can determinate if a Module has been already loaded
             * or is currently active
             *
             * @type String
             * @required
             */
            name: null,

            /***
             * the full qualified name (e.g. app.module.MyModule) of the module to be loaded if the route is executed
             * or the ModuleLoader.loadModule method is invoked manually.
             * @type String
             * @required
             */
            moduleClass: null,

            /***
             *
             */
            attributes: null,

            relative: false
        }
    });
});