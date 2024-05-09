/* MongoDB */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 
const uri = process.env.MONGO_CONNECTION_STRING;
/* Our database and collection */
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect();
console.log(`To access server: http://localhost:5000`);
const http = require("http");
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
const bodyParser = require("body-parser");
/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
/* view/templating engine */
app.set("view engine", "ejs");
/* Initializes request.body with post information */ 
app.use(bodyParser.urlencoded({extended:false}));

/* Pages */
app.get("/", (request, response) => 
{
  response.render("homePage");
});

app.get("/enterWatchedMovie", (request, response) => 
{
    const variables = 
    {
        link: "http://localhost:5000/enterWatchedMovie"
    };

    response.render("enterWatchedMovie", variables);
});
app.post("/enterWatchedMovie", (request, response) => 
{
        const variables = 
        {
            title: request.body.title,
            rating: request.body.rating,
            description: request.body.description,
            toWatch: false
        };

        insertMovie(client, databaseAndCollection, variables);

        response.render("processWatchedMovie", variables);

});
app.get("/viewWatchedMovies", async (request, response) => 
{
        let table = '<table border = 1><tr><th>Title</th><th>Rating</th><th>Description</th><tr>'

        let filter = {toWatch : false};
        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);

        const result = await cursor.toArray();

        if (result)
        {
            result.forEach((movie) => {table += `<tr><td>${movie.title}</td><td>${movie.rating}</td><td>${movie.description}</td><tr>`});
            table += '</table>'
            let successfulSearch = {table: table};
            response.render("viewMovies", successfulSearch);
        }
        else
        {
            table += '</table>'
            let failedSearch = {table: table};
            response.render("viewMovies", failedSearch);
        }
});

app.get("/enterToWatchMovie", (request, response) => 
{
    const variables = 
    {
        link: "http://localhost:5000/enterToWatchMovie"
    };
    
    response.render("enterToWatchMovie", variables);
});
app.post("/enterToWatchMovie", (request, response) => 
{
        const variables = 
        {
            title: request.body.title,
            description: request.body.description,
            toWatch: true
        };
    
        insertMovie(client, databaseAndCollection, variables);
    
        response.render("processToWatchMovie", variables);
    
});
    
app.get("/viewToWatchMovies", async (request, response) => 
{
        let table = '<table border = 1><tr><th>Title</th><th>Description</th><tr>'
    
        let filter = {toWatch : true};
        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
    
        const result = await cursor.toArray();
    
        if (result)
        {
            result.forEach((movie) => {table += `<tr><td>${movie.title}</td><td>${movie.description}</td><tr>`});
            table += '</table>'
            let successfulSearch = {table: table};
            response.render("viewMovies", successfulSearch);
        }
        else
        {
            table += '</table>'
            let failedSearch = {table: table};
            response.render("viewMovies", failedSearch);
        }
});

app.get("/remove", async (request, response) => 
    {
    
            const result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .deleteMany({});
    
    
            let variables = {number: result.deletedCount}    
            response.render("homePage");
    
    });


app.get("/suggestRandomMovie", async (request, res) => 
{
    const axios = require('axios');

    const options = {
        method: 'GET',
        url: 'https://moviedatabase8.p.rapidapi.com/Random/20',
        headers: {
          'X-RapidAPI-Key': 'cfc528d0bfmsh2accf368a88c3fcp1ea039jsn29237869379e',
          'X-RapidAPI-Host': 'moviedatabase8.p.rapidapi.com'
        }
      };

    try 
    {
        const response = await axios.request(options);
        let table = '<table border = 1><tr><th>Title</th><th>Rating</th><th>Description</th><tr>'
        response.data.forEach((movie) => {table += `<tr><td>${movie.title}</td><td>${movie.vote_average}</td><td>${movie.overview}</td><tr>`})
        table += '</table>'
        let successfulSearch = {table: table};
        res.render("viewRandomMovie", successfulSearch);
    } 
    catch (error) 
    {
        console.error(error);
    }

});

async function insertMovie(client, databaseAndCollection, newMovie) 
{
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newMovie);
}

app.listen(5000);