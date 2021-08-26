sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberInt : function (sValue) {
			if (!sValue) {
				return 0;
			}
			return parseInt(sValue,10);
		}
	};
});