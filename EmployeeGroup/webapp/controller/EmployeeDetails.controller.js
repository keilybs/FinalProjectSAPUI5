// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
],
	/**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, JSONModel) {
        "use strict";

        return Controller.extend("logali.EmployeeGroup.controller.EmployeeDetails", {
            onInit: function () {

                this._bus = sap.ui.getCore().getEventBus();
                this._oBusyDialog = new sap.m.BusyDialog();
                this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            },
            //Se crea modelo JSON para los datos del dialogo
            onAfterRendering: function () {
                this.model = new JSONModel()
                this.getView().setModel(this.model, "Employee");

            },
            //evento beforeUploadStarts del componente UploadCollection
            onFileBeforeUpload: function (oEvent) {

                //this._oBusyDialog.open();
                let fileName = oEvent.getParameter("fileName");
                let oData = oEvent.getSource().getBindingContext().getObject();

                // @ts-ignore
                let oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                    name: "slug",
                    value: this.getOwnerComponent().SapId + ";" + oData.EmployeeId + ";" + fileName
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
            },
            //evento change del componente UploadCollection
            onFileChange: function (oEvent) {
                let oUplodCollection = oEvent.getSource();
                // Header Token CSRF - Cross-site request forgery
                let oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: this.getView().getModel().getSecurityToken()
                });
                oUplodCollection.addHeaderParameter(oCustomerHeaderToken);
            },
            //evento uploadComplete del componente UploadCollection
            onFileUploadComplete: function (oEvent) {
                oEvent.getSource().getBinding("items").refresh();

            },
            //evento fileDeleted del componente UploadCollection
            onFileDeleted: function (oEvent) {
                var oUploadCollection = oEvent.getSource();
                var sPath = oEvent.getParameter("item").getBindingContext().getPath();
                this.getView().getModel().remove(sPath, {
                    success: function () {
                        oUploadCollection.getBinding("items").refresh();
                    },
                    error: function () {

                    }
                });
            },
            //evento que se dispara al dar de baja un empleado
            onPressFiredEmployee: function (oEvent) {

                var sPath = this.getView().getBindingContext().getPath();

                MessageBox.confirm(this._oResourceBundle.getText("confirmDelete"), {
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            this.getView().getModel().remove(sPath, {
                                success: function () {
                                    MessageBox.success(this._oResourceBundle.getText("deleteOK"));
                                    this.refreshAfterDelete();
                                }.bind(this),
                                error: function (e) {
                                    window.message = JSON.parse(e.responseText).error.message.value;
                                    Log.error(window.message);
                                    MessageBox.error(this._oResourceBundle.getText("deleteKO"));
                                }.bind(this)
                            });
                        }
                    }.bind(this)
                });
            },
            //refresca la pantalla luego de eliminar un empleado
            //adicional publica el evento para actualizar los items del máster
            refreshAfterDelete: function () {
                var oView = this.getView(),
                    sPath = "";
                oView.bindElement(sPath);
                oView.byId("whitePage").setVisible(true);
                oView.byId("pageEmployeeDetails").setVisible(false);
                oView.byId("pageEmployeeDetails").setShowHeader(false);

                this._bus.publish("flexible", "refreshEmployees");

            },
            //evento al hacer clic en el botón de ascender, levanta el dialogo
            onPressPromote: function (oEvent) {
                //Get selected Controller
                var iconPressed = oEvent.getSource();

                //Context from the model
                var oContextPath = iconPressed.getBindingContext().getPath();

                if (!this._oDialogOrders) {
                    this._oDialogOrders = sap.ui.xmlfragment(this.getView().getId(), "logali.EmployeeGroup.fragment.promoteDialog", this);
                    this.getView().addDependent(this._oDialogOrders);
                };
                this.getView().byId("textAreaComments").addEndIcon({ src: "sap-icon://sys-enter-2" }).addStyleClass("iconText2");
                this._oDialogOrders.bindElement(oContextPath);
                this._oDialogOrders.open();
            },
            onCloseDialog: function () {
                this._oDialogOrders.close();
            },
            //Finalmente si se acepta el ascenso del empleado... se llama al create de la entidad Salaries
            promoteEmployee: function (oEvent) {

                var oModelPromote = oEvent.getSource().getModel("Employee"),
                    oDataEmployee = this.getView().getBindingContext().getObject();

                var odata = oModelPromote.getData();

                if (!odata.Salary || !odata.DateInc) {
                    MessageBox.error(this._oResourceBundle.getText("obligatoryItems"));
                } else {

                    var body = {
                        SapId: this.getOwnerComponent().SapId,
                        EmployeeId: oDataEmployee.EmployeeId,
                        Ammount: odata.Salary,
                        CreationDate: odata.DateInc,
                        Comments: odata.Comments
                    };

                    this._oBusyDialog.open();
                    this.getView().getModel().create("/Salaries", body, {
                        success: function () {
                            MessageBox.success(this._oResourceBundle.getText("promoteOK"));
                            this.getView().byId("idTimeline").getBinding("content").refresh();
                            this._oBusyDialog.close();
                        }.bind(this),
                        error: function (e) {
                            window.message = JSON.parse(e.responseText).error.message.value;
                            Log.error(window.message);
                            sap.m.MessageToast.show(this._oResourceBundle.getText("promoteKO"));
                        }.bind(this)
                    });
                    this._oDialogOrders.close();
                }
            }
        });
    });