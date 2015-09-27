'use strict';

var acl = require(__dirname + '/models/acl')();

exports = module.exports = function(customOptions) {
	var returnObj;

	if (customOptions === undefined) {
		customOptions = {};
	}

	if (customOptions.customRoutes === undefined) {
		customOptions.customRoutes = [];
	}

	customOptions.customRoutes.push({
		'regex': '^/$',
		'controllerName': 'login'
	});

	customOptions.middleware = [
		require('cookies').express(),
		require('larvitsession').middleware(), // Important that this is ran after the cookie middleware
		require('./models/controllerGlobal').middleware()
	];

	customOptions.afterware = [
		require('larvitsession').afterware()
	];

	returnObj = require('larvitbase')(customOptions);

	returnObj.on('httpSession', function(request, response) {
		var originalRunController = response.runController;

		response.runController = function() {
			acl.checkAndRedirect(request, response, function(err, userGotAccess) {
				if (err) {
					throw err;
				}

				// User got access, proceed with executing the controller
				if (userGotAccess) {
					originalRunController();
				} else {
					// If userGotAccess is false, we should not execute the controller.
					// Instead just run sendToClient directly, circumventing the afterware as well.
					response.sendToClient(null, request, response);
				}
			});
		};

		response.next();
	});

	return returnObj;
};
