const { BOT_TOKEN } = require("./../settings.js");
const fetch = require("node-fetch");

module.exports = (_name, _channel, _avatarURL) => {
    return new Promise((resolve, reject) => {
        if (!_avatarURL) {
            _avatarURL = "https://i.imgur.com/srjyh7d.png";
        }
        fetch(_avatarURL)
            .then((r) => r.buffer())
            .then((buf) => {
                let _avatar = `data:image/png;base64,` + buf.toString("base64");
                fetch(
                    `https://discord.com/api/v9/channels/${_channel}/webhooks`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            name: _name,
                            avatar: _avatar,
                        }),
                        headers: {
                            Authorization: `Bot ${BOT_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                    }
                )
                    .then((r) => r.json())
                    .then((res) => {
                        if (res.id) {
                            resolve(res);
                        } else {
                            reject(res);
                        }
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
};
