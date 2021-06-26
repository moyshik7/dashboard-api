const fetch = require("node-fetch");
const { BOT_TOKEN } = require("./../settings.js");

module.exports = (app, db) => {
    app.all("/bot/guild", async (req, res) => {
        /**
         * token is the token (aka hash) we saved in the client side cookies
         * which is md5 hash of the actual token
         * It can be used to fetch out the actual token from guild
         */
        let token = req.query.token || req.body.token;
        /**
         * Guild is the guild id of which we want to know about
         */
        let guild = req.query.guild || req.body.guild;
        if (!token) {
            /**
             * In case no token is provided send error
             */
            return res.send({ code: 1002, data: "No token provided" });
        }
        if (!guild) {
            /** In case no guild id is provided send error
             */
            return res.send({ code: 1002, data: "No guild id provided" });
        }
        /**
         * Since guild id looks like an integer (Snowflake) so we'll be sure that we are parsing it as a string and not as integer
         */
        token = token.toString();
        guild = guild.toString();
        try {
            /**
             * Now we'll fetch the actual token from the database
             */
            db.GetToken(token)
                .then(async (oauthData) => {
                    /**
                     * oauthData is what we saved in database which is
                     * the whole response from discord api
                     * a timeinteger
                     * an md5 has of the actual token which is stored in database
                     */
                    if (!oauthData) {
                        /**
                         * If no data exists for the token we'll send an error
                         */
                        return res.send({
                            code: 1005,
                            data: "Invalid request",
                        });
                    }
                    /**
                     * First we'll fetch the guild's data (permission, id, name etc)
                     */
                    const FinalData = await GetSpecifictDiscordGuild(guild);
                    /**
                     * Then we'll fetch all channels of the guild
                     */
                    FinalData.channels = await GetDiscordChannels(guild);
                    /**
                     * If the guild already have data saved in db we'll fetch it too
                     * Will add this again when I switch the client to react
                     * @deprecated
                     */
                    //FinalData.current = await GetCurrentData(guild);
                    /**
                     * Code 200 marks the request as a success
                     */
                    FinalData.code = 200;
                    /**
                     * Send the data
                     */
                    res.send(FinalData);
                })
                .catch((err) => {
                    /**
                     * In case the connection failed
                     */
                    console.log(err);
                    return res.send({ code: 1004, data: "Error on our side" });
                });
        } catch (err) {
            /**
             * In case something went weirdly wrong
             */
            console.log(err);
            return res.send({ code: 1004, data: "Error on our Side" });
        }
    });
};

const GetSpecifictDiscordGuild = (_guild_id) => {
    /**
     * return a new promise
     * on resolve it'll be the guild's info
     * on reject it's the error
     */
    return new Promise((resolve, reject) => {
        if (!_guild_id) {
            /**
             * In case I (accidentally) forget to put the _guild_id
             */
            reject("No guild ID");
        }
        /**
         * Fetch info of all guilds of the bot with discord api
         * Reference: https://discord.com/developers/docs/resources/user#get-current-user-guilds
         */
        fetch("https://discord.com/api/v9/users/@me/guilds", {
            method: "GET",
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        })
            /**
             * Since the result is in json
             */
            .then((r) => r.json())
            .then((result) => {
                if (result.code === 0) {
                    /**
                     * Discord sends the errors in this format
                     * { code: 0, error: "blah blah" }
                     * So if the code is 0 it indirectly means an error
                     * or maybe I should have done if(result.error)
                     */
                    reject(result);
                }
                /**
                 * Now result is an array of all the guilds of the bot
                 * We don't need all of them
                 * we'll only search and send the only one we need
                 * Sorry Discord you didn't leave any option to fetch an specific guild
                 * Otherwise we wouldn't be spamming the api
                 */
                let a = result.find((x) => x.id === _guild_id);
                /**
                 * As you know resolve is like return in promise
                 */
                resolve(a);
            })
            /**
             * In case Discord thinks we are the bad guys
             */
            .catch(reject);
    });
};
const GetDiscordChannels = (_guild_id) => {
    /**
     * return a new promise
     * on resolve it'll be the channel list
     * on reject it's the error
     */
    return new Promise((resolve, reject) => {
        if (!_guild_id) {
            /**
             * In case I (accidentally) forget to put the _guild_id
             */
            reject("No guild ID");
        }
        /**
         * Fetch all the channels of a guild
         * Reference: https://discord.com/developers/docs/resources/guild#get-guild-channels
         */
        fetch(`https://discord.com/api/v9/guilds/${_guild_id}/channels`, {
            method: "GET",
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        })
            /**
             * Since the result will be in json
             */
            .then((r) => r.json())
            .then((result) => {
                if (result.code === 0) {
                    /**
                     * Discord sends the errors in this format
                     * { code: 0, error: "blah blah" }
                     * So if the code is 0 it indirectly means an error
                     * or maybe I should have done if(result.error)
                     */
                    reject(result);
                }
                /**
                 * allC is the array (list) of all channels
                 * We'll not take everything the api sends us
                 * We'll take only a few things including
                 * id, name, nsfw
                 */
                const allC = [];
                /**
                 * Loop through the result array and pick each channels
                 * Here c is the channel
                 * Time complexity O(n)
                 */
                result.forEach((c) => {
                    if (c.type == 0) {
                        let v = {
                            /**
                             * id is the channel's id
                             * typs: Snowflake / string
                             */
                            id: c.id,
                            /**
                             * name is the name if the channel
                             * type: string
                             */
                            name: c.name,
                            /**
                             * nsfw means the nsfw status of the channel
                             * It means if the channel is nsfw (18+) or not
                             * In case you don't know what nsfw is go here: https://www.urbandictionary.com/define.php?term=NSFW
                             * type: boolean (true / false)
                             */
                            nsfw: c.nsfw,
                        };
                        allC.push(v);
                    }
                });
                /**
                 * As we know resolve is like return in promise
                 */
                resolve(allC);
            })
            /**
             * In case discord pranks with us
             */
            .catch(reject);
    });
};
