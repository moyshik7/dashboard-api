const fetch = require("node-fetch");
const { BOT_TOKEN } = require("./../settings.js");
const GetGuilds = require("./../res/guild.js");

module.exports = (app, db) => {
    app.all("/guilds", async (req, res) => {
        /**
         * Thus it'll be able to handle both POST and GET since I'll switch to POST in the future
         */
        const token = req.query.token || req.body.token;
        if (!token) {
            /**
             * If no token is provided reject the request
             */
            return res.send({ code: 1002, data: "No token provided" });
        }
        try {
            /**
             * Check if the token is in the database
             * token is the md5 hash of the actual token stored in client cookies
             * I might use passport in the future and replace it with sessions
             * the actual token can be brought from the database using the hash token
             * The hash is stored client side and sent to the api using GET or POST request (I'll be switching to POST in future)
             */
            db.GetToken(token)
                .then((oauthData) => {
                    if (!oauthData) {
                        /**
                         * If the hash dosen't exist in database send error
                         */
                        return res.send({
                            code: 1003,
                            data: "No results found for this token",
                        });
                    }
                    /** If the token exists get the user's guilds with the actual token we got from database
                     */
                    GetGuilds(oauthData)
                        .then(async (rawList) => {
                            /**
                             * rawlist: The user's guilds max 200
                             */
                            /**
                             * listOfGuilds: The bot's guilds (Max: unlimited I guess)
                             */
                            let listOfGuilds = await GetDiscordGuilds();
                            /**
                             * commonList: The guilda the bot and user have in common
                             */
                            let commonList = GetCommonGuilds(
                                listOfGuilds,
                                rawList
                            );
                            /**
                             * finalList: The list to send to client
                             * Only select the guilds the user has Administrator or Manage Guild permission in
                             * Using bit field to check permission.
                             * 8 = ADMINISTRATOR
                             * 20 = MANAGE_GUILD
                             */
                            const finalList = [];
                            commonList.forEach((gg) => {
                                if (
                                    (gg.permissions & 0x0000000008) ==
                                        0x0000000008 || //Administrator or
                                    (gg.permissions & 0x0000000020) ==
                                        0x0000000020 //Manage Guild
                                ) {
                                    /**
                                     * Push to the list if condition is true
                                     */
                                    finalList.push(gg);
                                }
                            });
                            /**
                             * Send the array of selected guilds
                             */
                            res.send(finalList);
                        })
                        .catch((err) => {
                            /**
                             * In case something breaks
                             */
                            console.log(err);
                            return res.send({
                                code: 1004,
                                data: "Error on our Side",
                            });
                        });
                })
                .catch((err) => {
                    /**
                     * In case something breaks
                     */
                    console.log(err);
                    return res.send({ code: 1004, data: "Error on our Side" });
                });
        } catch (err) {
            /**
             * If anything else breaks
             */
            console.log(err);
            return res.send({ code: 1004, data: "Error on our Side" });
        }
    });
};
const GetCommonGuilds = (discordGuilds, guildList) => {
    /**
     * The hard way
     * Loop through the first array
     * For each element search though the second array
     * If the record exists add it to the final array
     * Else move on
     * Time complexity: O(n²)
     */
    const _final = [];
    discordGuilds.forEach((_g) => {
        let _a = guildList.find((_ar) => _ar.id === _g.id);
        if (_a) {
            _final.push(_a);
        }
    });
    /**
     * return the final array
     */
    return _final;
};
const GetDiscordGuilds = () => {
    return new Promise((resolve, reject) => {
        /**
         * Fetch the bot's guilds (all)
         * Reference: https://discord.com/developers/docs/resources/user#get-current-user-guilds
         * Counting BOT_TOKEN as global variable (constant though)
         */
        fetch("https://discord.com/api/v9/users/@me/guilds", {
            method: "GET",
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        })
            .then((r) => r.json())
            .then((result) => {
                if (result.code == 0) {
                    /**
                     * Discord sends errors in this format:
                     * { "code": 0, "error": "blah blah blah" }
                     * So if code is 0 reject the promise
                     */
                    reject(result);
                } else {
                    /**
                     * else is not required I guess but better be safe
                     * If the result is good resolve it
                     * resolve = return in promise
                     */
                    resolve(result);
                }
            })
            /**
             * If anything goes wrong catch it and reject with it
             */
            .catch(reject);
    });
};
