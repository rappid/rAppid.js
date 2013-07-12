define(["js/core/Bindable","js/core/List"], function(Bindable, List){

    return Bindable.inherit('srv.core.User',{

        defaults: {
            authentications: List,
            userDetails: null
        },

        addAuthentication: function(authentication){
            this.$.authentications.add(authentication);
        },

        getAuthenticationByProviderName: function(providerName){
            var ret = null;
            this.$.authentiactions.each(function(auth){
                if(auth.$.provider === providerName){
                    ret = auth;
                    this["break"]();
                }
            });

            return ret;
        },

        isAnonymous: function(){
            return this.$.authentications.isEmpty();
        }

    });

});