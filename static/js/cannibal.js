// Init
checklogin();
post(document.getElementById('postform'));

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

function trylogin(xhr) {

    var feed = document.getElementById('feed');
    var button = document.getElementById('loginbutton');
    var obj = JSON.parse(xhr.responseText);

    if(obj.Username) {
        sessionStorage.cannibalname = obj.Username;
        checklogin();
        showpage("feed");

    } else {
        showpage("notloggedin");
    }
}

function mkxhr(dest, params, rfunc) {

    var xhr = new XMLHttpRequest();

    xhr.open("POST", dest, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4 && xhr.status == 200) {
            rfunc(xhr);
        }
    }

    xhr.send(params);
}

function post(elem) {

    var user = sessionStorage.getItem("cannibalname");
    var message = elem.elements["message"].value;

    elem.elements["message"].value = "";

    var params = "user=" + user + "&message=" + message;
    mkxhr("/post", params, printposts);
}

function login(elem) {

    var user = elem.elements["user"].value;
    var pass = elem.elements["pass"].value;

    var params = "user=" + user + "&pass=" + pass;

    mkxhr("/login", params, trylogin);
}

function register(elem) {

    var user = elem.elements["user"].value;
    var pass = elem.elements["pass"].value;
    var email = elem.elements["email"].value;

    var params = "user=" + user + "&pass=" + pass + "&email=" + email;

    mkxhr("/register", params, trylogin);
}

function logout() {

    var loginbutton = document.getElementById("loginbutton");
    var control = document.getElementById("control");

    sessionStorage.cannibalname = "";

    loginbutton.onclick = openlogin;
    loginbutton.innerHTML = "Log in";
    control.style.display = "none";
}

function checklogin() {

    if(!sessionStorage.cannibalname) { sessionStorage.cannibalname = ""; }

    var username = sessionStorage.getItem("cannibalname");
    var loginbutton = document.getElementById("loginbutton");
    var control = document.getElementById("control");

    if(username != "") {
        loginbutton.innerHTML = username;
        loginbutton.onclick = logout;
        control.style.display = "block";
    }
}

function showpage(show) {

    var feed = document.getElementById('feed');
    var control = document.getElementById('control');
    var register = document.getElementById('register');
    var login = document.getElementById('login');
    var loginbutton = document.getElementById('loginbutton');

    if(show == "login") {
        feed.style.display = "none";
        control.style.display = "none";
        login.style.display = "block";

    } else if(show == "register") {
        control.style.display = "none";
        login.style.display = "none";
        register.style.display = "block";

    } else if(show == "notloggedin") {
        feed.style.display = "block";
        control.style.display = "none";
        login.style.display = "none";
        register.style.display = "none";

    } else {
        feed.style.display = "block";
        control.style.display = "block";
        login.style.display = "none";
        register.style.display = "none";
    }
}

function openlogin() { showpage("login"); }

function openregister() { showpage("register"); }
