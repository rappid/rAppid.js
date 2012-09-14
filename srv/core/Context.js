define(['js/core/EventDispatcher', 'url', 'querystring'], function (EventDispatcher, Url, QueryString) {
    return EventDispatcher.inherit('srv.core.Context', {

        ctor: function(endPoint, request, response) {
            this.endPoint = endPoint;
            this.request = request;
            this.response = response;

            var urlInfo = Url.parse(request.url);
            request.urlInfo = urlInfo;
            urlInfo.parameter = QueryString.parse(urlInfo.query);

        }

    })
});