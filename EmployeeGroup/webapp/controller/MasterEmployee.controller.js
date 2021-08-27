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
            //evento submit del search, buscar por nombre o apellido en la lista
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
            //al hacer clic sobre un item de la lista...
            showEmployee: function (oEvent) {
                var path = oEvent.getSource().getBindingContextPath();
                this._bus.publish("flexible", "showEmployee", path);
            },
            //se refresca la lista luego de eliminar un empleado
            refreshEmployees: function(category, nameEvent){
                 this.getView().byId("UserList").getBinding("items").refresh();
            },
            //función que retorna al menú principal
            onPressBack: function(){
                const oHistory = History.getInstance(),
                sPreviousHash = oHistory.getPreviousHash();
                const oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true);
            }
        });
    });