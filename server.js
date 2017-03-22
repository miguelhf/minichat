// importations
var http = require('http');
var fs = require('fs'); 
var url = require('url');
var querystring = require('querystring');

//global variables declaration
var server = http.createServer();
var buffer = new Array();
var book = new Array();

// here starts the action! ;-)
server.on('request', control);
server.listen(8080);
console.log('\x1Bc');

// auxiliary functions
function control(req, res) {
	var user="";
	if (req.method == 'POST') {
		console.log('\x1Bc');
		req.on('data', function(chunk) {
			switch (kind_of_request(chunk)) {
				case "cki": // check-in management
					user = get_data(chunk);
					if (book.indexOf(user) == -1) {
						// new user, accept
						book.push(user);
						buffer.push("--" + user + " se ha incorporado al chat--\n");
						req.on('end', function() {
							res.writeHead(200, "OK", {'Content-Type': 'text/html'});
							res.write(get_json(req, false));
							res.end();
						});
					} else {
						//name already used, reject connection
						req.on('end', function() {
							res.writeHead(401, "DIE", {'Content-Type': 'text/html'});
							res.end();
						});
					} 
					break;
				case "cko": // check-out management
					user = get_data(chunk);
					var index = book.indexOf(user);
					if (index != -1) {
						book.splice(index, 1);
						buffer.push("--" + user + " ha abandonado el chat--\n");
						req.on('end', function() {
							res.writeHead(200, "OK", {'Content-Type': 'text/html'});
							res.end();
						});
					}
					break;
				case "msg": // receiving message management
					if (book.indexOf(get_user(req.url)) != -1) {
						buffer.push(get_user(req.url) + "> " + get_data(chunk) + "\n"); 
					} else {
						//not logged, reject connection
						req.on('end', function() {
							res.writeHead(401, "DIE", {'Content-Type': 'text/html'});
							res.end();
						});
						break;
					} 
					// what is next is common to both cases, so no break here!
				case "ref": // update chat management
					if (book.indexOf(get_user(req.url)) != -1) {
						req.on('end', function() {
							res.writeHead(200, "OK", {'Content-Type': 'text/html'});
							res.write(get_json(req, true));
							res.end();
						});
					} else {
						//not logged, reject connection
						req.on('end', function() {
							res.writeHead(401, "DIE", {'Content-Type': 'text/html'});
							res.end();
						});
					} 
					break;
				default:
					buffer.push(">>>>>"+chunk+"<<<<<");

			}
			console.log("# users connected: #\n" + book);
			console.log("# chat room: #\n" + readable(buffer));
		});
	} else {
		var web;
		// buffer.push("url asked is: "+req.url);
		switch (req.url) {
			case "/chat.js":
				web = fs.readFileSync('./chat.js');
				res.writeHead(200, {'content-type': 'text/javascript'});
				break;
			case "/chat.css":
				web = fs.readFileSync('./chat.css');
				res.writeHead(200, {'content-type': 'text/css'});
				break;
			default:
				web = fs.readFileSync('./index.html');
				res.writeHead(200, {'content-type': 'text/html'});
		}
		res.write(web);
		res.end();
	}
}

function readable(array) {
	var text = "";
	for (var i=0; i<array.length; i++) {text += array[i] + "\n";}
	return text;
}

function get_json(request, check_buff) {
	return "{\"buff_ind\":\"" + buffer.length + "\"," 
			+ "\"book_names\":" + JSON.stringify(book) + ","
			+ "\"buffer\":" + (check_buff ? buffer_filtered(get_user(request.url), get_index(request.url)) : "[]") + "}";
}

// returns the type of request the client is asking for
function kind_of_request(chunk) {
	return ((querystring.unescape(chunk.toString())).substring(0,3));
}

//returns the index of the client's buffer
function get_index(url) {
	return querystring.unescape(url.substring(url.indexOf('.')+1));
}

// returns the client's identity
function get_user(url){
	return querystring.unescape(url.substring(url.indexOf('/') + 1, url.indexOf('.')));
}

// returns the content of the client's message
function get_data(chunk) {
	var msg = querystring.unescape(chunk.toString());
	msg = msg.substring(msg.indexOf('=')+1);
	var slices = msg.split('+');
	msg = slices[0];
	for (var i=1; i<slices.length; i++) {msg = msg + " " + slices[i];}
	return msg;
}

// returns what the client hasn't already read from the buffer to avoid unnecessary overload
function buffer_filtered(user, rd_index) {
	var buff = new Array;
	for (var i=rd_index; i<buffer.length; i++) {
		var intervent = clear_to_read(user, buffer[i]);
		if (intervent != "") {buff.push(intervent);}
	}
	return JSON.stringify(buff);
}

// this function is necessary in order to filtrate messages when they are not meant to be broadcasted
function clear_to_read(user, intervention) {
	if (intervention.indexOf('> @[') == -1) {return intervention;}
	else {
		var speaker = intervention.substring(0, intervention.indexOf('> @['));
		var addressees = intervention.substring(intervention.indexOf('> @[')+4, intervention.indexOf(']'));
		var add_slices = addressees.split(',');
		for (var i=0; i<add_slices.length; i++) {
			if ((user==speaker)||(user==shortened(add_slices[i]))) {
				return ("(" + speaker + ")> " + intervention.substring(intervention.indexOf(']')+1));
			}
		}
		return "";
	}
}

// string management function: it deletes spaces on both sides of the string
function shortened(str) {
	var i = 0;
	var j = str.length-1;
	while (str.charAt(i) == " ") {i++;}
	while (str.charAt(j) == " ") {j--;}
	return str.substring(i, j+1);
}
