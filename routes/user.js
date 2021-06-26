const GetUser = require("./../res/user.js");

module.exports = (app, db) => {
    app.all("/user", async (req, res) => {
        const token = req.query.token || req.body.token;
        if (!token) {
            return res.send({ code: 1002, data: "No token provided" });
        }
        db.GetToken(token)
            .then((oauthData) => {
                if (!oauthData) {
                    return res.send({
                        code: 1003,
                        data: "No results found for this token",
                    });
                }
                GetUser(oauthData)
                    .then((user) => {
                        return res.send(user);
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.send({
                            code: 1004,
                            data: "Error on our Side",
                        });
                    });
            })
            .catch((err) => {
                console.log(err);
                return res.send({ code: 1004, data: "Error on our Side" });
            });
    });
};
