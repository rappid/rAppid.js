define(['js/core/Base'], function(Base) {
    var User = Base.inherit('srv.core.User', {
    });

    User.AnonymousUser = User.inherit('srv.core.User.AnonymousUser', {
    });

    return User;
});