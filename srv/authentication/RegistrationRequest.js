define(['js/core/Bindable'], function(Bindable) {
    return Bindable.inherit('srv.core.RegistrationRequest', {
        defaults: {
            /**
             * The name of the provider
             */
            provider: null,
            /**
             * A hash of user data to extend the user model
             */
            userData: null
        }
    });
});