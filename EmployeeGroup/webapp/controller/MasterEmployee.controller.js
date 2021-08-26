// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent"
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, History,UIComponent) {
        "use strict";

        return Controller.extend("logali.EmployeeGroup.controller.MasterEmployee", {
            onInit: function () {
                 this._bus = sap.ui.getCore().getEventBus();
                 this._bus.subscribe("flexible", "refreshEmployees", this.refreshEmployees, this);
            },
            onSearch: function (oEvent) {
                var aFilter = [],
                    sQuery = oEvent.getParameter("query"),
                    userList = this.getView().byId("UserList");

                if (sQuery && sQuery.length > 0) {

                    aFilter = [ new Filter("FirstName", FilterOperator.Contains, sQuery),
                                new Filter("LastName", FilterOperator.Contains, sQuery)
                              ];
                }
                var ofinalFilter = new Filter({
                    filters: aFilter,
                    and: false,
                });                
                userList.getBinding("items").filter(ofinalFilter, "Application");
            },
            showEmployee: function (oEvent) {
                var path = oEvent.getSource().getBindingContextPath();
                this._bus.publish("flexible", "showEmployee", path);
            },
            refreshEmployees: function(category, nameEvent){
                 this.getView().byId("UserList").getBinding("items").refresh();
            },
            onPressBack: function(){
                const oHistory = History.getInstance(),
                sPreviousHash = oHistory.getPreviousHash();
                const oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true);
            },
            onReadODataIncidence: function (employeeID) {

                this.getView().getModel().read("/Users", {
                    filters: [
                        new sap.ui.model.Filter("SapId", "EQ", this.getOwnerComponent().SapId),
                        new sap.ui.model.Filter("EmployeeId", "EQ", employeeID.toString())
                    ],
                    success: function (data) {
                        var incidenceModel = this._detailEmployeeView.getModel("incidenceModel");
                        incidenceModel.setData(data.results);
                        var tableIncidence = this._detailEmployeeView.byId("tableIncidence");
                        tableIncidence.removeAllContent();

                        for (var incidence in data.results) {

                            data.results[incidence]._ValidateDate = true;
                            data.results[incidence].EnabledSave = false;

                            var newIncidence = sap.ui.xmlfragment("logaligroup.Employees.fragment.NewIncidence",
                                this._detailEmployeeView.getController());
                            this._detailEmployeeView.addDependent(newIncidence);
                            newIncidence.bindElement("incidenceModel>/" + incidence);
                            tableIncidence.addContent(newIncidence);
                        }
                    }.bind(this),
                    error: function (e) {
                    }
                });
            }
        });
    });