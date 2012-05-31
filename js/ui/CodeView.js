define(
    ["js/ui/View", "js/lib/highlight/highlight", "js/lib/highlight/languages/xml", "js/lib/highlight/languages/javascript"], function (View, hljs) {
        function escape(html, encode) {
            return html
                .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        return View.inherit({
            defaults: {
                tagName: 'pre'
            },
            _getChildrenFromDescriptor: function (descriptor) {
                return [];
            },
            render: function(){
                var el = this.callBase();

                var tmp = this.$systemManager.$document.createElement("div");
                var html = "";
                for(var i = 0; i < this.$descriptor.childNodes.length; i++){
                    html += this._getTextContentFromDescriptor(this.$descriptor.childNodes[i]);
                }

                var j = 0;
                while(html.charCodeAt(j) === 10 || html.charCodeAt(j) === 32){
                   j++;
                }
                var lines = html.split('\n');
                lines.pop();
                lines.shift();
                for(var l = 0; l < lines.length; l++){
                    lines[l] = lines[l].substr(j-1);
                }
                var ret = hljs.highlightAuto(lines.join("\n"));
                el.innerHTML = ret.value;

                return el;
            },

            _renderChildren: function () {

            },
            _renderContentChildren: function () {

            },
            _renderHTML: function (html, oldString) {
                this.$el.innerHTML = html;
            }
        });
    }
);