// @ts-ignore
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/base/Log",
    "../model/formatter"
], function (Controller, JSONModel, MessageToast, MessageBox, History, UIComponent,Log,formatter) {
    "use strict";

    return Controller.extend("logali.EmployeeGroup.controller.controller.CreateEmployee", {
        
        formatter: formatter,
        onInit: function () {

            //variables globales
            this._wizard = this.byId("CreateProductWizard");
            this._oNavContainer = this.byId("wizardNavContainer");
            this._oWizardContentPage = this.byId("wizardContentPage");
            this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this._oBusyDialog = new sap.m.BusyDialog();

            //crea el icono dentro del textArea
            this.getView().byId("textAreaComments").addEndIcon({ src: "sap-icon://sys-enter-2" }).addStyleClass("iconText");

            //modelo del Metadata -- uso en los maxLength
            var odataM = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZEMPLOYEES_SRV/", true);
			this.getView().setModel(odataM, "oMetadaModel");
        },

        onAfterRendering: function(){

            //Se crea modelo JSON para los datos en pantalla y valueStates
            this.model = new JSONModel()
            this.getView().setModel(this.model, "Employee");   
            
        },
        //función que retorna al menú principal
        _backMainMenu: function(){

            const oHistory = History.getInstance(),
                  sPreviousHash = oHistory.getPreviousHash();

            this._handleNavigationToStep(0);
            this._wizard.invalidateStep(this._wizard.getSteps()[0]);
            this.discardProgress(); //limpiar todo el contenido
            
            //navega a la vista Main, usando el target RouteMain
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMain", {}, true);
        },
        //evento disparado por el botón cancelar desde el wizard
        cancelCreateEmployee: function () {

            MessageBox.confirm(this._oResourceBundle.getText("confirmFinish"), {    
                onClose: function (oAction) {

                    if (oAction === "OK") {

                        this._backMainMenu();
                    }
                }.bind(this)
            });
        },
        //evento disparado de cualquiera de los 3 botones del paso 1 
        _onPressEmployeeType: function (oEvent) {
            var employeeType = oEvent.getSource().getText();
            this.model.setProperty("/EmployeeType", employeeType.charAt());
            this.model.setProperty("/EmployeeTypeText", employeeType);

            //Si hay mas de un paso activado, va al paso 2
            if (this._wizard.getProgress() > 1) {
                this._wizard.goToStep(this._wizard.getSteps()[1]);
            } else {
                this._wizard.nextStep();
            }
            this.model.setProperty("/DailyPrice", 400);
            if ( employeeType.charAt() === 'I') {
                this.model.setProperty("/GrossSalary", 24000);
            } else {
                this.model.setProperty("/GrossSalary", 70000);
            }
            this._infoValidation();
        },
        //función que valida la obligatoriedad de los campos del paso 2
        _isValidStep2: function (oEmployeeData) {

            var bValidStep2 = false;

            //Validar el llenado de campos obligatorios
            if (oEmployeeData.FirstNameState === "None" && oEmployeeData.LastNameState === "None" &&
                oEmployeeData.DateIncState === "None") {
                if (oEmployeeData.EmployeeType !== 'A' && oEmployeeData.DNIState === "None") {
                    bValidStep2 = true;
                } else if (oEmployeeData.EmployeeType === 'A' && oEmployeeData.CIFState === "None") {
                    bValidStep2 = true;
                }
            }
            return bValidStep2;
        },
        //funcion que habilita o deshabilita un paso del wizard
        _validateStep: function (bValidStep, iStep) {

            //Habilitar o deshabilitar paso N
            if (bValidStep) {
                this._wizard.validateStep(this._wizard.getSteps()[iStep]);
            } else {
                this._wizard.invalidateStep(this._wizard.getSteps()[iStep]);
            }
        },
        //evento al cambiar la fecha de incorporación
        onChangeDate: function (oEvent) {

            var oField = oEvent.getSource(),
                sValue = oField.getValue(),
                sFieldName = "/" + oField.getId().split("--",2)[1] + "State",
                oEmployeeData = this.model.getData(),
                bValidStep2 = false;

            //valida la obligatoriedad y si es un dato de fecha valido
            if (!sValue || !oField.isValidValue()) {
                this.model.setProperty(sFieldName, "Error");
                oField.setValueState("Error");
                oField.setValueStateText(this._oResourceBundle.getText("invalidDate"));
            } else {
                this.model.setProperty(sFieldName, "None");
                oField.setValueState("None");
                oField.setValueStateText("");
            }
            this._infoValidation();

        },
        //función resumida que valida la obligatoriedad de datos del paso 2
        _infoValidation: function(){
            
            var oEmployeeData = this.model.getData(),
                bValidStep2;
            
            //Validar los estados de los campos obligatorios
            bValidStep2 = this._isValidStep2(oEmployeeData);

            //Habilitar o deshabilitar el paso 2 y 3
            this._validateStep(bValidStep2, 1);
            this._validateStep(bValidStep2, 2);

        },
        //evento change de los campos: FirstName, LastName, DNI/CIF
        onChangeField: function (oEvent) {

            var oField = oEvent.getSource(),
                sValue = oField.getValue(),
                sFieldName = oField.getId().split("--",2)[1],
                sPropertyState = "/" + sFieldName + "State",
                oEmployeeData = this.model.getData(),
                bValidStep2 = false;

            //Si el dato está vacio....
            if (!sValue) {
                this.model.setProperty(sPropertyState, "Error");
                oField.setValueState("Error");
                oField.setValueStateText(this._oResourceBundle.getText("obligatory"));
            } else {
                this.model.setProperty(sPropertyState, "None");
                oField.setValueState("None");
                oField.setValueStateText("");
            }
            //Valida solo el DNI
            if ( sFieldName === "DNI" && oEmployeeData.EmployeeType !== "A" && !this._validateDNI(sValue)){
                this.model.setProperty(sPropertyState, "Error");
                oField.setValueState("Error");
                oField.setValueStateText(this._oResourceBundle.getText("invalidDNI"));
            }
            this._infoValidation();
            
        },
        //función que valida el DNI español 
        _validateDNI: function (dni) {

            var number, letter, letterList;
            var bValid = false;

            var regularExp = /^\d{8}[a-zA-Z]$/;
            //Se comprueba que el formato es válido
            if (regularExp.test(dni) === true) {
                //Número
                number = dni.substr(0, dni.length - 1);
                //Letra
                letter = dni.substr(dni.length - 1, 1);
                number = number % 23;
                letterList = "TRWAGMYFPDXBNJZSQVHLCKET";
                letterList = letterList.substring(number, number + 1);
                if (letterList !== letter.toUpperCase()) {
                    bValid = false;
                } else {
                    bValid = true;
                }
            } 
            return bValid;
        },
        //función que toma los nombres de los ficheros del componente UploadCollection
        // y los asigna a un modelo JSON
        _getAttachments:function () {

            var uploadCollection = this.byId("uploadCollection"),
                oAttachItems     = uploadCollection.getItems(),
                iCantidad = uploadCollection.getItems().length,
                aAttachmentsNames = [];

            this.model.setProperty("/Quantity",iCantidad.toString());
            
            for(var i in oAttachItems){
                aAttachmentsNames.push({ fileName: oAttachItems[i].getFileName() });	
            }
            this.model.setProperty("/Attachments",aAttachmentsNames);
         
        },
        //Guarda los datos del empleado llamando al metodo create de la entidad Users
        saveEmployee(){
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oData = this.model.getData(),
                sEmployeeType = oData.EmployeeType === "I" ? "0":  oData.EmployeeType === "A" ? "1": "2",
                sAmmount      = oData.EmployeeType === "A" ? parseFloat(oData.DailyPrice).toString() :
                                                             parseFloat(oData.GrossSalary).toString(),
                sId = oData.EmployeeType === "A" ? oData.CIF :
                                                   oData.DNI,                                             
                aSalary = [];

            //body de la entidad Users
            var body = {
                EmployeeId: "",                
                SapId: this.getOwnerComponent().SapId,
                Type: sEmployeeType,
                FirstName: oData.FirstName,
                LastName: oData.LastName,
                Dni : sId,
                CreationDate: oData.DateInc,
                Comments: oData.Comments,
                UserToSalary: []
            };
            //asociation UserToSalary
            body.UserToSalary.push({
                SalaryId : "",
                EmployeeId: "",  
                SapId: this.getOwnerComponent().SapId,                
                Ammount : sAmmount,
                Comments: oData.Comments,
                Waers: "EUR"
            });

            this._oBusyDialog.open(); 

            //Llamado al create de la entidad Users
            this.getView().getModel().create("/Users", body, {
                success: function (data) {
                    this.model.setProperty("/EmployeeId",data.EmployeeId);
                    this.byId("uploadCollection").upload(); //adjuntar documentos
                    this._oBusyDialog.close();
                    MessageBox.success(oResourceBundle.getText("odataSaveOK",data.EmployeeId),{    
                        onClose: function (oAction) {
                            this._backMainMenu();
                        }.bind(this)
                    });
                    
                }.bind(this),
                error: function (e) {
                    window.message = JSON.parse(e.responseText).error.message.value;
                    Log.error(window.message);
                    sap.m.MessageToast.show(oResourceBundle.getText("odataSaveKO"));
                }.bind(this)
            });
        },
        //evento beforeUploadStarts del componente UploadCollection
        onFileBeforeUpload: function (oEvent) {
                let fileName = oEvent.getParameter("fileName");
                let oData = this.model.getData();
                
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
            // @ts-ignore
            let oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                name: "x-csrf-token",
                value: this.getView().getModel().getSecurityToken()
            });
            oUplodCollection.addHeaderParameter(oCustomerHeaderToken);           
        },
        //evento uploadComplete del componente UploadCollection
        onFileUploadComplete: function (oEvent) {
             this._oBusyDialog.close();
        },        

        wizardCompletedHandler: function () {

            this._oNavContainer.to(this.byId("__xmlview0--wizardReviewPage"));
            this._getAttachments();

        },

        backToWizardContent: function () {
            this._oNavContainer.backToPage(this._oWizardContentPage.getId());
        },

        editStepOne: function () {
            this._handleNavigationToStep(0);
        },

        editStepTwo: function () {
            this._handleNavigationToStep(1);
        },

        editStepThree: function () {
            this._handleNavigationToStep(2);
        },

        _handleNavigationToStep: function (iStepNumber) {
            var fnAfterNavigate = function () {
                this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
                this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
            }.bind(this);

            this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
            this.backToWizardContent();
        },

        discardProgress: function () {
            this._wizard.discardProgress(this._wizard.getSteps()[0]);

            var clearContent = function (content) {
                for (var i = 0; i < content.length; i++) {
                    if (content[i].setValue) {
                        content[i].setValue("");
                    }

                    if (content[i].getContent) {
                        clearContent(content[i].getContent());
                    }
                }
            };
            clearContent(this._wizard.getSteps());
            this.model.setProperty("/EmployeeTypeText", "");
            this.model.setProperty("/FirstNameState", "None");
            this.model.setProperty("/LastNameState", "None");
            this.model.setProperty("/CIFState", "None");
            this.model.setProperty("/DNIState", "None");
            this.model.setProperty("/DateIncState", "None");
            this.getView().byId("uploadCollection").destroyItems();
        }
    });
});
