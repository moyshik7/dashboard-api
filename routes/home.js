const fetch = require("node-fetch");
const md5 = require("md5");

const GetUser = require("./../res/user.js");
const { clientID, clientSecret, URL } = require("./../settings.js");

module.exports = (app, db) => {
    app.all("/", async (request, res) => {
        /**
         * Code is the base code the user'll get after authentication
         * It can be used to fetch the oauth2 object which can be used to fetch user and guild datas
         * It can handle both POST and GET request from now on
         */
        const code = request.query.code;
        if (!code) {
            /**
             * If no code found send the error
             */
            return res.send({ code: 1002, data: "No code provided" });
        }
        try {
            /**
             * Get the oauth2 object using the code received from client
             * Reference: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-urls
             */
            const oauthData = await fetch(
                "https://discord.com/api/oauth2/token",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        client_id: clientID,
                        client_secret: clientSecret,
                        code: code,
                        grant_type: "authorization_code",
                        redirect_uri: URL,
                        scope: "identify guilds",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            )
                /**
                 * Since the data will be in JSON format
                 */
                .then((r) => r.json())
                .catch((err) => {
                    /**
                     * In case something wend wrong in the request
                     * Eg: Using the code again after it's been used (reloading browser)
                     * Eg2: Invalid redirect_uri
                     */
                    console.log(err);
                    return res.send({ code: 1004, data: "Error on our Side" });
                });
            if (!oauthData.access_token) {
                /**
                 * Refer to the above comment
                 * Sometimes it doesn't trigger an error and puts the eddor as JSON (like me)
                 * So if access_token dosen't exist in the response we'll take it as error
                 */
                console.log(oauthData);
                return res.send({ code: 1003, data: "Invalid response" });
            }
            /**
             * SaveData: the data we'll save in the database
             * It'll have the whole oauth2 object we received from the api
             * A timestamp to check when it took place
             * A hash of the token which we'll store in client side cookies
             * It can be used to fetch back the original token from the database
             */
            const SaveData = oauthData;
            /**
             * Adding the timestamp
             */
            SaveData.time = Date.now();
            /**
             * Adding the hash with md5
             */
            SaveData.hash = md5(oauthData.access_token);
            /**
             * Saving the data in database
             */
            await db.SetToken(SaveData).catch((err) => {
                /**
                 * In case database fails to save it
                 */
                console.log(err);
                return res.send({ code: 1004, data: "Error on our Side" });
            });
            /**
             * Now we'll fetch the userdata
             * And then send it along with a hash
             */
            const data = {};
            /**
             * Fetching the user data
             */
            data.user = await GetUser(oauthData);
            /**
             * Adding the hash
             */
            data.hash = SaveData.hash;
            /**
             * code 200 marks the request as a success
             */
            data.code = 200;
            /**
             * Sending the data
             */
            return res.send(data);
        } catch (error) {
            /**
             * In case something breaks during execution of the code
             */
            console.log(error);
            return res.send({ code: 1004, data: "Error on our side" });
        }
    });
};
