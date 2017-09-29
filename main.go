package main

import (
    "fmt"
    "log"
    "strings"
    "strconv"
    "net/http"
	"encoding/json"

	"github.com/boltdb/bolt"
)

const dbname = ".mblog.db"
var bucket = []byte("bucket")

type Post struct {
    ID          int
    User        string
    Message     string
}

func cherr(e error) {
    if e != nil { log.Fatal(e) }
}

// Write JSON encoded byte slice to DB
func wrdb(db *bolt.DB, k int, v []byte) (e error) {

	e = db.Update(func(tx *bolt.Tx) error {
		b, e := tx.CreateBucketIfNotExists(bucket)
		if e != nil { return e }

		e = b.Put([]byte(strconv.Itoa(k)), v)
		if e != nil { return e }

		return nil
	})
	return
}

// Get JSON encoded byte slice from DB
func rdb(db *bolt.DB, k int) (v []byte, e error) {

	e = db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(bucket)
		if b == nil { return fmt.Errorf("No bucket!") }

		v = b.Get([]byte(strconv.Itoa(k)))
		return nil
	})
	return
}

func getposts(db *bolt.DB, id int) ([]Post) {

    posts := []Post{}
    post := Post{}

    for i := 0; i < id; i++ {
        b, e := rdb(db, i)
        json.Unmarshal(b, &post)
        cherr(e)
        posts = append(posts, post)
    }

    return posts
}

func jsonhandler(w http.ResponseWriter, r *http.Request, db *bolt.DB, id int) (int) {

    path := strings.TrimPrefix(r.URL.Path, "/")
    if strings.HasSuffix(path, ".ico") { return id }

    e := r.ParseForm()
    cherr(e)

    user := r.FormValue("user")
    message := r.FormValue("message")

    if user != "" && message != "" {
        post := Post{ID: id, User: user, Message: message}
        jsonpost, e := json.Marshal(post)
        if e != nil { return id }

        e = wrdb(db, id, []byte(jsonpost))
        cherr(e)
        id++;
    }

    posts := getposts(db, id);
    enc := json.NewEncoder(w)
    enc.Encode(posts)

    return id
}

func main() {

	db, e := bolt.Open(dbname, 0640, nil)
	cherr(e)
	defer db.Close()

    id := 0;

    // Static content
    http.Handle("/", http.FileServer(http.Dir("static")))

    // Dynamic content
    http.HandleFunc("/json", func(w http.ResponseWriter, r *http.Request) {
        id = jsonhandler(w, r, db, id)
    })

    E = http.ListenAndServe(":9001", nil)
    cherr(e)
}
