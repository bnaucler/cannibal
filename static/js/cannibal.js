
if(!sessionStorage.loggedin) { sessionStorage.loggedin = false; }
if(!sessionStorage.username) { sessionStorage.username = ""; }

checklogin();

function printposts(xhr) {

    var obj = JSON.parse(xhr.responseText);
    var olen = obj.length;
    var pdiv = document.getElementById('feed');

    pdiv.innerHTML = '';

    for(var i = 0; i < obj.length; i++) {
        var post = document.createElement('div');
        var name = document.createElement('h4');
        var message = document.createElement('p');

        post.className = "post";

        name.appendChild(document.createTextNode(obj[i].User));
        message.appendChild(document.createTextNode(obj[i].Message));

        post.appendChild(name);
        post.appendChild(message);

        pdiv.appendChild(post);
    }
}

function post(elem) {

    var user = elem.elements["user"].value;
    var message = elem.elements["message"].value;

    var xhr = new XMLHttpRequest();
    var params = "user=" + user + "&message=" + message;

    xhr.open("POST", "/post", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4 && xhr.status == 200) printposts(xhr);
    }

    xhr.send(params);
}

function trylogin(xhr) {

    showloginpage(false);

    var feed = document.getElementById('feed');
    var button = document.getElementById('loginbutton');
    var obj = JSON.parse(xhr.responseText);

    console.log(obj);

    if(obj.Username) {
        sessionStorage.loggedin = 1;
        sessionStorage.username = obj.Username;
    }
}

function logout() {

    var loginbutton = document.getElementById("loginbutton");

    sessionStorage.loggedin = false;
    sessionStorage.username = "";

    loginbutton.onclick = openlogin;
    loginbutton.innerHTML = "Log in";
}

function checklogin() {

    var username = sessionStorage.getItem("username");
    var loginbutton = document.getElementById("loginbutton");

    if(username != "") {
        loginbutton.innerHTML = username;
        loginbutton.onclick = logout;
    }
}

function login(elem) {

    var user = elem.elements["user"].value;
    var pass = elem.elements["pass"].value;

    var xhr = new XMLHttpRequest();
    var params = "user=" + user + "&pass=" + pass;

    console.log(params);

    xhr.open("POST", "/login", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4 && xhr.status == 200) trylogin(xhr);
    }

    xhr.send(params);
}

function showloginpage(show) {

    var feed = document.getElementById('feed');
    var control = document.getElementById('control');
    var login = document.getElementById('login');

    if(show) {
        feed.style.display = "none";
        control.style.display = "none";
        login.style.display = "block";

    } else {
        feed.style.display = "block";
        control.style.display = "block";
        login.style.display = "none";
    }
}

function openlogin() {

    var feed = document.getElementById('feed');
    var loggedin = sessionStorage.getItem("loggedin");

    if(loggedin == "false") showloginpage(true);
    else feed.innerHTML = "you're logged in!"
}

post(document.getElementById('postform')); // Init on first page load
