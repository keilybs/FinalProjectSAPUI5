// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("logali.EmployeeGroup.controller.ListEmployee", {
            onInit: function () {
                var oView = this.getView();
                this._bus = sap.ui.getCore().getEventBus();

                this._detailEmployeeView = this.getView().byId("detailEmployeeView");

                var oJSONModelLayout = new sap.ui.model.json.JSONModel();
                oJSONModelLayout.loadData("./model/json/Layout.json", false);
                oView.setModel(oJSONModelLayout, "jsonLayout");

                this._bus.subscribe("flexible", "showEmployee", this.showEmployeeDetails, this);
            },
            //evento que se dispara desde el MasterEmployee al hacer clic en un item de la lista
            //hace el binding de la vista EmployeeDetails
            showEmployeeDetails: function (category, nameEvent, path) {

                var detailView = this.getView().byId("detailEmployeeView");
                detailView.bindElement(path);
                detailView.byId("whitePage").setVisible(false);
                detailView.byId("pageEmployeeDetails").setVisible(true);
                detailView.byId("pageEmployeeDetails").setShowHeader(true);
                this.getView().getModel("jsonLayout").setProperty("/ActiveKey", "TwoColumnsMidExpanded");

                //Bind Files
                var pathToAttach = path + "/UserToAttachment";
                detailView.byId("uploadCollection").bindAggregation("items", {
                    path: pathToAttach,
                    template: new sap.m.UploadCollectionItem({
                        documentId: "{AttId}",
                        visibleEdit: false,
                        fileName: "{DocName}"
                    }).attachPress(this.downloadFile)
                });
                

            },
            //evento que descarga el archivo de forma local
            downloadFile : function(oEvent) {
                const sPath = oEvent.getSource().getBindingContext().getPath();
                window.open("/sap/opu/odata/sap/ZEMPLOYEES_SRV" + sPath + "/$value","file");
            }                       
        });
    });