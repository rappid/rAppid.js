define(["js/ui/View"], function (View) {

    var leafClass = 'tree-view-leaf',
        rootClass = 'tree-view-root';

    return View.inherit({

        defaults: {
            componentClass: "tree-view",
            node: null,
            selectedNode: null,
            expanded: "{node.expanded}",
            root: "{_self()}"
        },

        $classAttributes: ["root", "node"],

        _initializationComplete: function () {
            this.bind('root', 'change:selectedNode', this._onSelectedNodeChange, this);
            this.callBase();
            if(this.$.root && this.$.root.$.selectedNode){
                if(this.$.node === this.$.root.$.selectedNode){
                    this._expandParents();
                    this.set('selected', true);
                }
            }
        },

        _onSelectedNodeChange: function (e) {
            var node = e.$;

            this.set('selected', node === this.$.node);
            if(this.$.selected){
                this._expandParents();
            }
        },

        _expandParents: function(){
            if(this.$.node){
                var parentNode = this.$.node.$.parentNode;
                while(parentNode){
                    parentNode.set('expanded', true);
                    parentNode = parentNode.$.parentNode;
                }
            }
        },

        _renderNode: function (node) {
            if (node) {
                if (node.$.isLeaf) {
                    this.addClass(leafClass);
                } else {
                    this.removeClass(leafClass);
                }
                if (node.$.isRoot) {
                    this.addClass(rootClass);
                } else {
                    this.removeClass(rootClass);
                }
            } else {
                this.removeClass(leafClass);
                this.removeClass(rootClass);
            }

        },

        _renderExpanded: function (expanded) {
            if (expanded) {
                this.addClass("expanded");
            } else {
                this.removeClass("expanded");
            }
        },

        _handleClick: function () {
            if (this.$.node) {
                if (!this.$.node.$.isLeaf) {
                    this.$.node.toggle();
                }
                var root = this.$.root;
                if (this.$.node.$.expanded || this.$.node.$.isLeaf) {
                    root.set('selectedNode', this.$.node);
                } else {
                    root.set('selectedNode', null);
                }
            }
        },

        _self: function () {
            return this;
        }
    });
});