package main

import (
    "fmt"
    "log"
    "strconv"
    "net/http"
	"encoding/json"

	"github.com/boltdb/bolt"
)

const dbname = ".cannibal.db"
const NUMPOSTS = 6

var pbuc = []byte("pbuc")       // post bucket
var ubuc = []byte("ubuc")       // user bucket
var sbuc = []byte("sbuc")       // settings bucket

type Post struct {
    ID          int
    User        string
    Message     string
}

type User struct {
    ID          int
    Username    string
    Pass        string
    Email       string
}

type Settings struct {
    Nextid      int
    Nextuser    int
}

func cherr(e error) {
    if e != nil { log.Fatal(e) }
}

// Write JSON encoded byte slice to DB
func wrdb(db *bolt.DB, k int, v []byte, cbuc []byte) (e error) {

	e = db.Update(func(tx *bolt.Tx) error {
		b, e := tx.CreateBucketIfNotExists(cbuc)
		if e != nil { return e }

		e = b.Put([]byte(strconv.Itoa(k)), v)
		if e != nil { return e }

		return nil
	})
	return
}

// Return JSON encoded byte slice from DB
func rdb(db *bolt.DB, k int, cbuc []byte) (v []byte, e error) {

	e = db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(cbuc)
		if b == nil { return fmt.Errorf("No bucket!") }

		v = b.Get([]byte(strconv.Itoa(k)))
		return nil
	})
	return
}

// Return posts with IDs between min and max as struct
func getposts(db *bolt.DB, min int, max int) ([]Post) {

    posts := []Post{}
    post := Post{}

    for i := max; i >= min; i-- {
        b, e := rdb(db, i, pbuc)
        json.Unmarshal(b, &post)
        cherr(e)
        posts = append(posts, post)
    }

    return posts
}

func getminmax(id int) (min int, max int) {

    min = id - NUMPOSTS
    if min < 0 { min = 0 }

    max = id -1

    return

}

// Write post to db
func wrpost(r *http.Request, db *bolt.DB, id int) (int) {

    e := r.ParseForm()
    cherr(e)

    post := Post{ID: id, User: r.FormValue("user"), Message: r.FormValue("message")}

    if post.User != "" && post.Message != "" {

        jsonpost, e := json.Marshal(post)
        if e != nil { return id }

        e = wrdb(db, id, []byte(jsonpost), pbuc)
        cherr(e)
        id++;
    }

    return id
}

// Handle post requests
func posthandler(w http.ResponseWriter, r *http.Request, db *bolt.DB, id int) (int) {

    id = wrpost(r, db, id)

    min, max := getminmax(id)
    posts := getposts(db, min, max);

    enc := json.NewEncoder(w)
    enc.Encode(posts)

    return id
}

func getuser(db *bolt.DB, login string, maxid int) (User){

    user := User{}

    for i := 0; i < maxid; i++ {
        b, e := rdb(db, i, ubuc)
        cherr(e)
        json.Unmarshal(b, &user)
        if user.Username == login {
            return user
        }
    }

    return User{}
}

func validateuser(user User, password string) (bool) {

    if user.Pass == password { return true
    } else { return false }
}

// Handle login requests
func loginhandler(w http.ResponseWriter, r *http.Request, db *bolt.DB, maxid int) {

    e := r.ParseForm()
    cherr(e)

    user := getuser(db, r.FormValue("user"), maxid)

    if user.Username != "" {

        if validateuser(user, r.FormValue("pass")) {
            user.Pass = ""

        } else {
            user = User{}
        }

    } else {
        user = User{}
    }

    enc := json.NewEncoder(w)
    enc.Encode(user)
}

func main() {

	db, e := bolt.Open(dbname, 0640, nil)
	cherr(e)
	defer db.Close()

    // DEBUG
    user0 := User{ID: 0, Username: "bjenn", Pass: "password1"}
    wruser, e := json.Marshal(user0)
    wrdb(db, 0, []byte(wruser), ubuc)
    user1 := User{ID: 1, Username: "hazel", Pass: "password2"}
    wruser, e = json.Marshal(user1)
    wrdb(db, 1, []byte(wruser), ubuc)
    nextuser := 2;
    // NODEBUG

    id := 0;

    // Static content
    http.Handle("/", http.FileServer(http.Dir("static")))

    // Creating / reading posts
    http.HandleFunc("/post", func(w http.ResponseWriter, r *http.Request) {
        id = posthandler(w, r, db, id)
    })

    // Login
    http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
        loginhandler(w, r, db, nextuser)
    })

    e = http.ListenAndServe(":9001", nil)
    cherr(e)
}
