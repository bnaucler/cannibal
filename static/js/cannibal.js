// Alias to reduce typing
var gid = document.getElementById.bind(document);

// Init
checklogin();
getposts();

// Update feed every 10 seconds
var timer = setInterval(getposts, 10000);

function vemail(email) {

    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function printposts(xhr) {

    var obj = JSON.parse(xhr.responseText);
    var olen = obj.Posts.length;
    var pdiv = gid('feed');
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

    var feed = gid('feed');
    var button = gid('mbutton');
    var obj = JSON.parse(xhr.responseText);

    if(obj.Username) {
        sessionStorage.cannibalname = obj.Username;
        sessionStorage.cannibalkey = obj.Skey;
        checklogin();

    } else {
        showpage("base");
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

    var feedstat = getComputedStyle(gid('feed'), null).display;

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

    if(vemail(email)) {
        var params = "user=" + user + "&pass=" + pass + "&email=" + email;
        elem.reset();

        mkxhr("/register", params, trylogin);

    } else {
        var mf = elem.elements["email"];
        mf.style.backgroundColor = "#fdd";
    }
}

function logout() {

    sessionStorage.cannibalname = "";
    sessionStorage.cannibalkey = "";

    showpage("base");
}

function checklogin() {

    if(!sessionStorage.cannibalname) { sessionStorage.cannibalname = ""; }
    if(!sessionStorage.cannibalkey) { sessionStorage.cannibalkey = ""; }

    var username = sessionStorage.getItem("cannibalname");
    var skey = sessionStorage.getItem("cannibalkey");

    if(username != "" && skey != "") showpage("feed");
    else showpage("base");
}

function setmbutton(text, func) {

    var mbutton = gid("mbutton");

    mbutton.innerHTML = text;
    mbutton.onclick = func;
}

function setdisp(elem, pages) {

    for(var pg in elem) {
        elem[pg].style.display = pages.indexOf(pg) > -1 ? "block" : "none";
    }
}

function showpage(show) {

    var elem = {feed: gid('feed'),
                control: gid('control'),
                register: gid('register'),
                login: gid('login')
               };

    var username = sessionStorage.getItem("cannibalname");

    if(show == "login") {
        setmbutton("Cancel", logout);
        setdisp(elem, ["login"]);

    } else if(show == "register") {
        gid("registerform").elements["email"].style.backgroundColor = "#fff"; // TODO
        setmbutton("Cancel", logout);
        setdisp(elem, ["register"]);

    } else if(show == "base") {
        setmbutton("Log in", openlogin);
        setdisp(elem, ["feed"]);

    } else {
        setmbutton(username, logout);
        setdisp(elem, ["control", "feed"]);

        getposts();
    }
}

function openlogin() { showpage("login"); }

function openregister() { showpage("register"); }
