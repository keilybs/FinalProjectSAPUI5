// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("logali.EmployeeGroup.controller.MasterEmployee", {
            onInit: function () {


            } ,
		    onSearch: function (oEvent) {
                var aFilter = [],
                    sQuery = oEvent.getParameter("query"),
                    userList = this.getView().byId("UserList");

                if (sQuery && sQuery.length > 0) {

                    aFilter = [ new Filter("FirstName", FilterOperator.Contains, sQuery),
                                new Filter("LastName", FilterOperator.Contains, sQuery),
                                new Filter("Dni", FilterOperator.Contains, sQuery)
                              ];
                }
                var finalFilter = new Filter({
                    filters: aFilter ,
                    and: false
                });
                userList.getBinding("items").filter([finalFilter], "Application");
            },

        });
    });