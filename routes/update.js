const CreateWebhook = require("./../res/createwebhook.js");

module.exports = (app, db) => {
    app.post("/update", (req, res) => {
        if (!req.body) {
            return res.send({ code: 1002, data: "No data provided" });
        }
        const guild = req.query.guild || req.body.guild;
        const token = req.query.token || req.body.token;
        if (!guild) {
            return res.send({ code: 1002, data: "No guild ID provided" });
        }
        if (!token) {
            return res.send({ code: 1002, data: "No token provided" });
        }
        db.GetGuildData(guild)
            .then(async (g) => {
                const nr = {};
                nr.id = guild;
                if (!g) {
                    if (
                        !req.body.memes ||
                        !req.body.memes.channel ||
                        req.body.memes.channel == "0"
                    ) {
                        nr.memes = null;
                    } else {
                        let aer;
                        nr.memes = await CreateWebhook(
                            "Plubin - Memes",
                            req.body.memes.channel
                        ).catch((err) => (aer = err));
                        if (aer) {
                            console.log(aer);
                            return res.send({
                                code: 1006,
                                data: "Permission denied",
                            });
                        }
                        nr.memes.channel = nr.memes.channel_id;
                        nr.memes.guild = nr.memes.guild_id;
                    }
                    if (
                        !req.body.nsfw ||
                        !req.body.nsfw.channel ||
                        req.body.nsfw.channel == "0"
                    ) {
                        nr.nsfw = null;
                    } else {
                        let aer;
                        nr.nsfw = await CreateWebhook(
                            "Plubin - NSFW",
                            req.body.nsfw.channel
                        ).catch((err) => (aer = err));
                        if (aer) {
                            console.log(aer);
                            return res.send({
                                code: 1006,
                                data: "Permission denied",
                            });
                        }
                        nr.nsfw.channel = nr.nsfw.channel_id;
                        nr.nsfw.guild = nr.nsfw.guild_id;
                    }
                    db.SetGuildData(nr)
                        .then((result) => {
                            if (!result) {
                                console.log(result);
                            }
                            return res.send({ code: 200, data: "All good" });
                        })
                        .catch((err) => {
                            console.log(err);
                            return res.send({
                                code: 1004,
                                data: "Error on our side",
                            });
                        });
                } else {
                    /**
                     * If g aka Guild Data exists then
                     */
                    if (!g.memes) {
                        g.memes = {
                            channel: "0",
                        };
                    }
                    if (!g.nsfw) {
                        g.nsfw = {
                            channel: "0",
                        };
                    }
                    if (
                        !req.body.memes ||
                        !req.body.memes.channel ||
                        (req.body.memes.channel == "0") ||
                        (req.body.memes.channel == g.memes.channel)
                    ) {
                        if(req.body.memes && (req.body.memes.channel == "0")){
                            nr.memes = null
                        } else {
                            nr.memes = g.memes;
                        }
                    } else {
                        let aer;
                        nr.memes = await CreateWebhook(
                            "Plubin - Memes",
                            req.body.memes.channel
                        ).catch((err) => (aer = err));
                        if (aer) {
                            console.log(aer);
                            return res.send({
                                code: 1006,
                                data: "Permission denied",
                            });
                        }
                        nr.memes.channel = nr.memes.channel_id;
                        nr.memes.guild = nr.memes.guild_id;
                    }
                    if (
                        !req.body.nsfw ||
                        !req.body.nsfw.channel ||
                        (req.body.nsfw.channel == "0") ||
                        //(!g.nsfw && !req.body.nsfw.channel) ||
                        (req.body.nsfw.channel == g.nsfw.channel)
                    ) {
                        if(req.body.nsfw && (req.body.nsfw.channel == "0")){
                            nr.nsfw = null
                        } else {
                            nr.nsfw = g.nsfw;
                        }
                    } else {
                        let aer;
                        nr.nsfw = await CreateWebhook(
                            "Plubin - NSFW",
                            req.body.nsfw.channel
                        ).catch((err) => (aer = err));
                        if (aer) {
                            console.log(aer);
                            return res.send({
                                code: 1006,
                                data: "Permission denied",
                            });
                        }
                        //console.log(nr.nsfw)
                        nr.nsfw.channel = nr.nsfw.channel_id;
                        nr.nsfw.guild = nr.nsfw.guild_id;
                    }
                    db.UpdateGuildData(guild, nr)
                        .then((result) => {
                            if (!result) {
                                console.log(result);
                            }
                            return res.send({ code: 200, data: "All good" });
                        })
                        .catch((err) => {
                            console.log(err);
                            return res.send({
                                code: 1004,
                                data: "Error on our side",
                            });
                        });
                }
            })
            .catch((err) => {
                console.log(err);
                return res.send({ code: 1004, data: "Error on our side" });
            });
    });
};
