define(["js/core/Component", "js/data/Collection", "srv/core/Identity", "js/data/Query"], function (Component, Collection, Identity, Query) {

    return Component.inherit('srv/core/IdentityService', {

        defaults: {
            dataSource: null
        }

    })

});