define(["js/ui/View"], function (View) {

        var findPlaceholders = function (str) {
            var placeholders = [], p;
            var stack = [], c, indexPos = 0;
            for (var i = 0; i < str.length; i++) {
                c = str.charAt(i);

                if (c == "[" && stack.length === 0) {
                    p = {};
                    p.start = i;
                    stack.push(i);
                } else if (c == "|") {
                    indexPos = i;
                } else if (c == "]" && stack.length > 0 && indexPos > 0) {
                    p.index = parseInt(str.substring(indexPos + 1, i));
                    p.end = i;
                    p.text = str.substring(p.start + 1, indexPos);
                    placeholders.push(p);
                    stack.pop();
                }
            }

            return placeholders;
        };

        return View.inherit({
            defaults: {
                tagName: "span"
            },
            _getChildrenFromDescriptor: function () {
                return [];
            },
            _renderChildren: function () {

            },
            _renderContentChildren: function () {

            },

            _getNodeForIndex: function (index) {
                if (this.$descriptor.childNodes.length > index) {
                    return this.$descriptor.childNodes[index];
                } else if (this.$internalDescriptors.length) {
                    var descr;
                    for (var i = 0; i < this.$internalDescriptors.length; i++) {
                        descr = this.$internalDescriptors[i];
                        if (descr.childNodes.length > index) {
                            return descr.childNodes[index];
                        }
                    }
                }
                return null;
            },

            _renderString: function (string, oldString) {
                for (var k = 0; k < this.$el.childNodes.length; k++) {
                    this.$el.removeChild(this.$el.childNodes[k]);
                }
                if (string) {
                    var placeholders = findPlaceholders(string);
                    var ph, start = -1;
                    for (var i = 0; i < placeholders.length; i++) {
                        ph = placeholders[i];

                        if (ph.start > start) {
                            this.$el.appendChild(this.$stage.$document.createTextNode(string.substring(start + 1, ph.start)));
                        }

                        start = ph.end;
                        if (!this.$viewMap) {
                            this.$viewMap = {};
                        }
                        var key = ph.index + ":" + i;
                        var childView = this.$viewMap[key];
                        if (!childView) {
                            childView = this._createComponentForNode(this._getNodeForIndex(ph.index));
                            if (childView) {
                                childView.$parentScope = this.$parentScope;
                                childView.$rootScope = this.$rootScope;
                                childView.$cidScope = this.$cidScope;
                                this.$viewMap[key] = childView;
                            }
                        }
                        if (childView) {
                            childView.set("$text", ph.text);
                            childView._initialize("auto", true);
                            if (!childView.isRendered()) {
                                childView.render();
                            }
                            this.$children.push(childView);
                            this.$el.appendChild(childView.$el);
                        } else {
                            this.$el.appendChild(this.$stage.$document.createTextNode(ph.text));
                        }
                    }
                    if (start < string.length) {
                        this.$el.appendChild(this.$stage.$document.createTextNode(string.substr(start + 1)));
                    }

                }
            }
        });
    }
);