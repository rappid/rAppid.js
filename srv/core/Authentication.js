define(['js/core/Base'], function(Base) {
    return Base.inherit('srv.core.Authentication', {
        ctor: function(user, authenticationData){
            this.user = user;
            this.data = authenticationData;
            this.callBase();
        }
    });
});