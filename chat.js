var app = angular.module('chat', []);//['ngAnimate']);

app.controller('chat_manager', function($scope, $http, $interval, com_mgr) {
	$scope.logged		= false;
	$scope.user			= "";
	$scope.buff_ind		= 0;
	$scope.header		= function() {return $scope.logged ? "Bienvenido al minichat, " + $scope.user + ":" : "Bienvenido al minichat:";}
	$scope.prompt		= function() {return $scope.logged ? ("> ") : ("Introduce tu nombre de usuario:");}
	$scope.submit_text	= function() {com_mgr.send_text($scope, $http, $interval);}
	$scope.check_out	= function() {com_mgr.check_out($scope, $http, $interval);}
});

// This service handles the communications with the server
app.service('com_mgr', function() {
	var self = this;
	this.send_text = function($scope, $http, $interval){
		var usr, code;
		if (!$scope.logged) {
			usr = $scope.entry;
			code = "cki=";
		} else {
			usr = $scope.user;
			code = "msg=";
		}
		$http({
			method : "POST",
			url : "/" + usr + "." + $scope.buff_ind,
			data : code + $scope.entry
		}).then(function myresponse(response){
			$scope.entry = "";
			if (!$scope.logged) {
				$scope.logged = true;
				$scope.user = usr;
				$scope.chat = new Array();
			} else {
				$interval.cancel($scope.interval);
			}
			$scope.buff_ind = response.data.buff_ind;
			$scope.book_names = response.data.book_names;
//			$scope.chat = $scope.chat.concat(response.data.buffer);
			$("#chat_window").append(self.get_text(response.data.buffer));
			$("div#chat").scrollTop = $("div#chat").scrollHeight;
			$scope.interval = $interval(function() {self.refresh($scope, $http, $interval);}, 1000);
		}, function myerror(response){
			$scope.entry = "";
		});
	}

	this.get_text = function(arr) {
		var txt = "";
		for (var i=0; i<arr.length; i++) {txt += arr[i] + "</br>";}
		return txt;
	}

	this.check_out = function($scope, $http, $interval){
		$scope.logged = false;
		$http({
			method : "POST",
			url : "/" + $scope.user + "." + $scope.buff_ind,
			data : "cko=" + $scope.user
		}).then(function myresp(response){}, function myerr(response){});
		$interval.cancel($scope.interval);
		$("#chat_window").firstChild.remove();
//		$("div#chat_container").append("<div id=\"chat_window\" ng-show=\"logged\" style=\"border:solid 1px #000000; padding:4px; width:480px; height:200px; overflow:auto\"></div>");
	}

	this.refresh = function($scope, $http, $interval) {
		if ($scope.logged) {
			$http({
				method : "POST",
				url : "/" + $scope.user + "." + $scope.buff_ind,
				data : "ref"
			}).then(function myresp(response){
				$scope.buff_ind = response.data.buff_ind;
				$scope.book_names = response.data.book_names;
//				$scope.chat = $scope.chat.concat(response.data.buffer);
				$("#chat_window").append(self.get_text(response.data.buffer));
				$("div#chat").scrollTop = $("div#chat").scrollHeight;
			}, function myerr(response){});
		}
	}

});
