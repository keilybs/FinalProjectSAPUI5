// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("logali.EmployeeGroup.controller.Main", {
            onInit: function () {

                this.getView().byId("tileSignOrder").setUrl("https://c1120ca1trial-dev-logali-approuter.cfapps.eu10.hana.ondemand.com");
               
            },
            onAfterRendering(){
               
                var genericTileFirmarPedido = this.getView().byId("tileSignOrder");
                var idGenericTileFirmarPedido = genericTileFirmarPedido.getId();
                jQuery("#"+idGenericTileFirmarPedido)[0].id = ""; 
            },
            onPressTileCreateEmployee: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteCreateEmployee", {});
            },
            onPressTileListEmployee: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteListEmployee", {});
            }
                             
        });
    });
