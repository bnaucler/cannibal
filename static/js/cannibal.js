// Init
checklogin();
getposts();

var timer = setInterval(getposts, 10000);

function printposts(xhr) {

    var obj = JSON.parse(xhr.responseText);
    var olen = obj.Posts.length;
    var pdiv = document.getElementById('feed');
    var user = sessionStorage.getItem("cannibalname");
    var skey = sessionStorage.getItem("cannibalkey");

    pdiv.innerHTML = '';

    if(user != "" && obj.Skey != skey) logout();

    for(var i = 0; i < olen; i++) {
        var post = document.createElement('div');
        var name = document.createElement('h4');
        var message = document.createElement('p');

        post.className = "post";

        name.appendChild(document.createTextNode(obj.Posts[i].User));
        message.appendChild(document.createTextNode(obj.Posts[i].Message));

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
        sessionStorage.cannibalkey = obj.Skey;
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

function getposts() {

    var feedstat = getComputedStyle(document.getElementById('feed'), null).display;

    if(feedstat == "block") {
        var user = sessionStorage.getItem("cannibalname");
        var skey = sessionStorage.getItem("cannibalkey");

        var params = "user=" + user + "&skey=" +skey;
        mkxhr("/post", params, printposts);
    }

}

function post(elem) {

    var user = sessionStorage.getItem("cannibalname");
    var skey = sessionStorage.getItem("cannibalkey");
    var message = elem.elements["message"].value;

    var params = "user=" + user + "&message=" + message + "&skey=" + skey;
    elem.reset();

    mkxhr("/post", params, printposts);
}

function login(elem) {

    var user = elem.elements["user"].value;
    var pass = elem.elements["pass"].value;

    var params = "user=" + user + "&pass=" + pass;
    elem.reset();

    mkxhr("/login", params, trylogin);
}

function register(elem) {

    var user = elem.elements["user"].value;
    var pass = elem.elements["pass"].value;
    var email = elem.elements["email"].value;

    var params = "user=" + user + "&pass=" + pass + "&email=" + email;
    elem.reset();

    mkxhr("/register", params, trylogin);
}

function logout() {

    var loginbutton = document.getElementById("loginbutton");
    var control = document.getElementById("control");

    sessionStorage.cannibalname = "";
    sessionStorage.cannibalkey = "";

    loginbutton.onclick = openlogin;
    loginbutton.innerHTML = "Log in";
    control.style.display = "none";
}

function checklogin() {

    if(!sessionStorage.cannibalname) { sessionStorage.cannibalname = ""; }
    if(!sessionStorage.cannibalkey) { sessionStorage.cannibalkey = ""; }

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
        getposts();
    }
}

function openlogin() { showpage("login"); }

function openregister() { showpage("register"); }
