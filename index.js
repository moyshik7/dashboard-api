const express = require("express");
const cors = require("cors");

const app = new express();
app.use(cors());
app.use(express.json());
const Webhook = require('./webhook.js')
const Database = require("./db/db.js");

const { PORT, DB_URL, DB_NAME } = require("./settings.js");

let db;
Database.connect(DB_URL, DB_NAME)
    .then((res) => {
        if (!res) {
            return console.log(`Can't connect to database`);
        }
        db = res;
        Webhook(db) //Test
        setInterval(() => {
            Webhook(db)
        },5*60*1000)
        console.log("Autopost started")
        /**
         * home.js will listen to '/' route
         */
        require("./routes/home.js")(app, db);
        /**
         * user.js will listen to '/user' route
         */
        require("./routes/user.js")(app, db);
        /**
         * guilds.js will listen to '/guilds' route
         */
        require("./routes/guilds.js")(app, db);
        /**
         * bot-guilds.js will listen to '/bot/guild' route
         */
        require("./routes/bot-guild.js")(app, db);
        /**
         * update.js will listen to '/update' route
         */
        require("./routes/update.js")(app, db);

        /**
         * Start the app listening on PORT
         * And then send a message on success
         */
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(console.log);
/*
Error codes:
- 1002: Missing Information (Not enough data provided)
- 1003: No Data (No Data Found for that query)
- 1004: Server side error (Server Crashed to process the query)
- 1005: Probably frawd
*/
