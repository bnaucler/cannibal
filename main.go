package main

import (
    "fmt"
    "log"
    "time"
    "strconv"
    "net/http"
    "math/rand"
	"encoding/json"

	"github.com/boltdb/bolt"
    "golang.org/x/crypto/bcrypt"
)

const dbname = ".cannibal.db"
const NUMPOSTS = 6
const KEYLEN = 30

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
    Skey        string
    Username    string
    Pass        []byte
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

// Get settings from db
func getsettings(db *bolt.DB) (Settings, error) {

    settings := Settings{}
    b, e := rdb(db, 0, sbuc)
    json.Unmarshal(b, &settings)

    return settings, e
}

// Write settings to db
func wrsettings(db *bolt.DB, settings Settings) (error) {

    msettings, e := json.Marshal(settings)
    cherr(e)
    e = wrdb(db, 0, []byte(msettings), sbuc)

    return e
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
func wrpost(r *http.Request, db *bolt.DB, settings Settings) (Settings) {

    e := r.ParseForm()
    cherr(e)

    post := Post{ID: settings.Nextid, User: r.FormValue("user"), Message: r.FormValue("message")}

    if post.User != "" && post.Message != "" {

        jsonpost, e := json.Marshal(post)
        if e != nil { return settings }

        e = wrdb(db, settings.Nextid, []byte(jsonpost), pbuc)
        cherr(e)
        settings.Nextid++;
        e = wrsettings(db, settings)
        cherr(e)
    }

    return settings
}

// Handle post requests
func posthandler(w http.ResponseWriter, r *http.Request, db *bolt.DB, settings Settings) (Settings) {

    settings = wrpost(r, db, settings)

    min, max := getminmax(settings.Nextid)
    posts := getposts(db, min, max);

    enc := json.NewEncoder(w)
    enc.Encode(posts)

    return settings
}

func getuser(db *bolt.DB, login string, maxid int) (User) {

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

    e := bcrypt.CompareHashAndPassword(user.Pass, []byte(password))

    if e == nil { return true
    } else { return false }
}

// Create random string of length ln
func randstr(ln int) (string){

    const charset = "0123456789abcdefghijklmnopqrstuvwxyz"
    var cslen = len(charset)

    b := make([]byte, ln)
    for i := range b { b[i] = charset[rand.Intn(cslen)] }

    return string(b)
}

// Handle login requests
func loginhandler(w http.ResponseWriter, r *http.Request, db *bolt.DB, settings Settings) {

    e := r.ParseForm()
    cherr(e)

    user := getuser(db, r.FormValue("user"), settings.Nextuser)

    if user.Username != "" {

        if validateuser(user, r.FormValue("pass")) {
            user.Pass = []byte("hidden")
            user.Skey = randstr(30) // TODO: Implement

        } else {
            user = User{}
        }

    } else {
        user = User{}
    }

    enc := json.NewEncoder(w)
    enc.Encode(user)
}

// Write user to db
func wruser(db *bolt.DB, user User) (error) {

    muser, e := json.Marshal(user)
    cherr(e)
    e = wrdb(db, user.ID, []byte(muser), ubuc)

    return e
}

// Handle registration requests
func reghandler(w http.ResponseWriter, r *http.Request, db *bolt.DB, settings Settings) (Settings) {

    e := r.ParseForm()
    cherr(e)

    hash, e := bcrypt.GenerateFromPassword([]byte(r.FormValue("pass")), bcrypt.DefaultCost)

    user := User{ID: settings.Nextuser,
                 Username: r.FormValue("user"),
                 Pass: hash,
                 Email: r.FormValue("email")}

    indb := getuser(db, user.Username, settings.Nextuser)

    if(indb.Username != "") {
        user = User{}

    } else {
        e = wruser(db, user)
        if e == nil { settings.Nextuser++ }
    }

    enc := json.NewEncoder(w)
    enc.Encode(user)

    return settings
}

func main() {

    rand.Seed(time.Now().UnixNano())

	db, e := bolt.Open(dbname, 0640, nil)
	cherr(e)
	defer db.Close()

    settings, e := getsettings(db)

    // Static content
    http.Handle("/", http.FileServer(http.Dir("static")))

    // Creating / reading posts
    http.HandleFunc("/post", func(w http.ResponseWriter, r *http.Request) {
        settings = posthandler(w, r, db, settings)
    })

    // Login
    http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
        loginhandler(w, r, db, settings)
    })

    // Register
    http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
        settings = reghandler(w, r, db, settings)
    })

    // Start server
    e = http.ListenAndServe(":9001", nil)
    cherr(e)
}
