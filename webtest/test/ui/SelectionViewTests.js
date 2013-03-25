describe("#SelectionView", function () {

    var view,
        items;

    describe("#sv1", function () {

        beforeEach(function(){
            view = window.application.$.sv1;
            items = window.application.$.sv1_items;
        });

        it('should render items with templates', function () {
            $expect("#sv1").to.exist().
                and.to.have.children("li").
                that.have.items(items.size());


            items.each(function(item, index){
                $expect($("#sv1").find('li').eq(index)).to.have.attr('class', ""+item.id).and.to.have.text(item.value);
            });
        });

        it('should by default have NO item which is selected', function(){
            $expect($("#sv1").find('li.active')).to.have.items(0);
        });

        it('should add class active to selectedItem and remove when unset selectedItem', function(){
            view.set('selectedItem', items.at(1));
            $expect($("#sv1").find('li.active')).to.have.items(1);

            view.set('selectedItem', null);
            $expect($("#sv1").find('li.active')).to.have.items(0);
        });

        it('should have correct selectedItem on click', function(){

            var index = 0;
            $("#sv1").find('li').eq(index).click();

            expect(view.$.selectedItem).to.exist;
            expect(view.$.selectedItem).to.be.equal(items.at(index));

            view.set('selectedItem', null);
        });

        it('should not be possible to deselect item when "allowDeselection=false"', function(){

            expect(view.$.selectedItem).to.not.exist;

            var index = 0;

            var $li = $("#sv1").find('li').eq(index);
            $li.click();

            expect(view.$.selectedItem).to.exist;
            expect(view.$.selectedItem).to.be.equal(items.at(index));

            $li.click();
            expect(view.$.selectedItem).to.exist;
            expect(view.$.selectedItem).to.be.equal(items.at(index));

            view.set('selectedItem', null);
        });

        it('should not be possible to select multiple items when "multiSelect=false"', function(){

            expect(view.$.selectedItem).to.not.exist;

            var $li = $("#sv1").find('li');
            $li.eq(0).click();

            $expect($("#sv1").find('li.active')).to.have.items(1);

            $li.eq(1).click();

            $expect($("#sv1").find('li.active')).to.have.items(1);
        });

    });

    describe("#sv2", function () {

        beforeEach(function () {
            view = window.application.$.sv2;
            items = window.application.$.sv2_items;
        });

        it('should have first item selected when "needsSelection=true"', function () {
            $expect($("#sv2").find('li.active')).to.have.items(1);
            expect(view.$.selectedItem).to.be.equal(items.at(0));
        });

        it('should allow deselection when "allowDeselection=true" and "needsSelection="true"', function(){

            $expect($("#sv2").find('li.active')).to.have.items(1);

            $("#sv2").find('li.active').click();

            $expect($("#sv2").find('li.active')).to.have.items(0);
        });

    });

    describe('#sv3', function(){

        beforeEach(function () {
            view = window.application.$.sv3;
            items = window.application.$.sv3_items;
        });

        it('should select first item when "needsSelection=true" and wrong selectedItem is set', function () {
            $expect($("#sv3").find('li.active')).to.have.items(1);
            expect(view.$.selectedItem).to.be.equal(items.at(0));
        });

    });

    describe('#sv4', function () {

        beforeEach(function () {
            view = window.application.$.sv4;
            items = window.application.$.sv4_items;
        });

        it('should select the selectedItem when "needsSelection=true" and selectedItem is set', function () {
            $expect($("#sv4").find('li.active')).to.have.items(1);
            expect(view.$.selectedItem).to.be.equal(items.at(1));
        });

    });




});