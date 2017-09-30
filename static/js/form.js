function printposts(xhr) {

    var obj = JSON.parse(xhr.responseText);
    var olen = obj.length;
    var pdiv = document.getElementById('feed');

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

    xhr.open("POST", "/json", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4 && xhr.status == 200) printposts(xhr);
    }

    xhr.send(params);
}

post(document.getElementById('post')); // Init on first page load
