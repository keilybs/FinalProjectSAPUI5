// @ts-ignore
sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/base/Log"
], function (Controller, JSONModel, MessageToast, MessageBox, History, UIComponent,Log) {
    "use strict";

    return Controller.extend("logali.EmployeeGroup.controller.controller.CreateEmployee", {
        onInit: function () {

            this._wizard = this.byId("CreateProductWizard");
            this._oNavContainer = this.byId("wizardNavContainer");
            this._oWizardContentPage = this.byId("wizardContentPage");
            this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this._oBusyDialog = new sap.m.BusyDialog();

            //var oIcon = new sap.ui.core.Icon("",{ src: "sap-icon://accept" }).addStyleClass("sapUiTinyMarginEnd");
            this.getView().byId("textAreaComments").addEndIcon({ src: "sap-icon://accept" , noTabStop:true });
            
        },
        onAfterRendering: function(){
            this.model = new JSONModel()
            this.getView().setModel(this.model, "Employee");   
            
        },
        cancelCreateEmployee: function () {

            const oHistory = History.getInstance(),
                sPreviousHash = oHistory.getPreviousHash();

            MessageBox.confirm(this._oResourceBundle.getText("confirmFinish"), {    
                onClose: function (oAction) {

                    if (oAction === "OK") {

                        //REVISAR 05_08
                        // this.model.setData(null);
                        this._handleNavigationToStep(0);
                        this._wizard.invalidateStep(this._wizard.getSteps()[0]);
                        this.discardProgress();
                        
                        /*if (sPreviousHash !== undefined) {
                            window.history.go(-1);
                        } else {*/
                            const oRouter = UIComponent.getRouterFor(this);
                            oRouter.navTo("RouteMain", {}, true);
                      //  }
                    }
                }.bind(this)
            });
        },
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
            if (this.model.EmployeeType === 'I') {
                this.model.setProperty("/GrossSalary", 24000);
            } else {
                this.model.setProperty("/GrossSalary", 70000);
            }
        },
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
        _validateStep: function (bValidStep, iStep) {

            //Habilitar o deshabilitar paso N
            if (bValidStep) {
                this._wizard.validateStep(this._wizard.getSteps()[iStep]);
            } else {
                this._wizard.invalidateStep(this._wizard.getSteps()[iStep]);
            }
        },
        _dateValidation: function (oEvent) {

            var oField = oEvent.getSource(),
                sValue = oField.getValue(),
                sFieldName = "/" + oField.getId().replace("__xmlview0--", "") + "State",
                oEmployeeData = this.model.getData(),
                bValidStep2 = false;

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
        _infoValidation: function(){
            
            var oEmployeeData = this.model.getData(),
                bValidStep2;
            
            //Validar los estados de los campos obligatorios
            bValidStep2 = this._isValidStep2(oEmployeeData);

            //Habilitar o deshabilitar el paso 2 y 3
            this._validateStep(bValidStep2, 1);
            this._validateStep(bValidStep2, 2);

        },
        onChangeField: function (oEvent) {

            var oField = oEvent.getSource(),
                sValue = oField.getValue(),
                sFieldName = oField.getId().replace("__xmlview0--", ""),
                sPropertyState = "/" + sFieldName + "State",
                oEmployeeData = this.model.getData(),
                bValidStep2 = false;

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
        _completedStep2: function(){

            const sError = sap.ui.core.ValueState.Error,
                  oEmployeeData = this.model.getData();
            var   sValue,
                  oField;

            //Valida solo el DNI
            switch(oEmployeeData.EmployeeType){
                case 'A':
                    oField = this.getView().byId("DNI");
                    sValue = oField.getValue();

                    if (!this._validateDNI(sValue) || !sValue){
                        this.model.setProperty("/DNIState", sError);
                        oField.setValueState(sError);
                        oField.setValueStateText(this._oResourceBundle.getText("invalidDNI")); 
                        this._infoValidation();           
                    }
                    break; 
                default:
                     oField = this.getView().byId("CIF");
                    sValue = oField.getValue();

                    if (!sValue){
                        this.model.setProperty("/CIFState", sError);
                        oField.setValueState(sError);
                        oField.setValueStateText(this._oResourceBundle.getText("obligatory")); 
                        this._infoValidation();            
                    }
                    break; 
            }
            
        },
        _saveEmployee(){
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oData = this.model.getData(),
                sEmployeeType = oData.EmployeeType === "I" ? "0":  oData.EmployeeType === "A" ? "1": "2",
                sAmmount      = oData.EmployeeType === "A" ? parseFloat(oData.DailyPrice).toString() :
                                                             parseFloat(oData.GrossSalary).toString(),
                sId = oData.EmployeeType === "A" ? oData.CIF :
                                                   oData.DNI,                                             
                aSalary = [];

               
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
            body.UserToSalary.push({
                SalaryId : "",
                EmployeeId: "",  
                SapId: this.getOwnerComponent().SapId,                
                Ammount : sAmmount
            });

            this._oBusyDialog.open();
            this.getView().getModel().create("/Users", body, {
                success: function (data) {
                    this.model.setProperty("/EmployeeId",data.EmployeeId);
                    this.byId("uploadCollection").upload();
                    MessageBox.success(oResourceBundle.getText("odataSaveOK"));
                    this._oBusyDialog.close();
                }.bind(this),
                error: function (e) {
                    window.message = JSON.parse(e.responseText).error.message.value;
                    Log.error(window.message);
                    sap.m.MessageToast.show(oResourceBundle.getText("odataSaveKO"));
                }.bind(this)
            });
        },
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
        onFileUploadComplete: function (oEvent) {
             this._oBusyDialog.close();
        },        
        optionalStepActivation: function () {
            MessageToast.show(
                'This event is fired on activate of Step3.'
            );
        },

        optionalStepCompletion: function () {
            MessageToast.show(
                'This event is fired on complete of Step3. You can use it to gather the information, and lock the input data.'
            );
        },

        scrollFrom4to2: function () {
            this._wizard.goToStep(this.byId("dataEmployeeStep"));
        },

        goFrom4to3: function () {
            if (this._wizard.getProgressStep() === this._wizard.getSteps()[2]) {
                this._wizard.previousStep();
            }
        },

        goFrom4to5: function () {
            if (this._wizard.getProgressStep() === this._wizard.getSteps()[2]) {
                this._wizard.nextStep();
            }
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
