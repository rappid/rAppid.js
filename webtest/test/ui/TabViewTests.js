describe("#TabView", function () {

    describe("#simple", function () {

        it('should render tab view with navigation and first tab activated', function () {

            $expect("#t1").to.exist();

            $expect("#t1 ul").to.exist().
                and.to.have.children("li").
                that.have.items(window.application.$.t1.$.tabItems.size());

            $expect('#t1 ul li.active').to.exist()
                .and.to.contain("first");

            $expect('#t1 .tab-content').to.contain("first");

        });

        it('should switch tab when clicking on another tab-item', function () {

            $("#t1 ul li:not(.active)").eq(0).click();
            $expect('#t1 ul li.active').to.exist()
                .and.to.contain("second");

            $("#t1 ul li:not(.active)").eq(0).click();
            $expect('#t1 ul li.active').to.exist()
                .and.to.contain("first");

        });

        it('should not switch tab when click on active again', function () {

            var text = $('#t1 .tab-content').eq(0).text();
            $("#t1 ul li.active").eq(0).click();
            $expect('#t1 .tab-content').to.contain(text);

        });

    });

    describe('selected tab attribute', function () {

        var tabView;
        beforeEach(function () {
            tabView = window.application.$.t1;
        });

        it('should contain the selected tab', function () {

            $expect('#t1 .tab-content').to.contain(tabView.$.selectedTab.$.title);

        });

        it('should change active tab and tab-content when setting other selected tab', function () {

            var currentTab = tabView.$.selectedTab;
            var thirdTab = window.application.$["t1-3"];
            tabView.set('selectedTab', thirdTab);

            $expect('#t1 .tab-content').to.contain(thirdTab.$.title);

            $expect('#t1 ul li.active').to.exist().and.to.contain(thirdTab.$.title);


            tabView.set('selectedTab', currentTab);

        });


    });


});