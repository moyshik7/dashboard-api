const fetch = require("node-fetch");
const express = require("express");
const md5 = require("md5");
const cors = require("cors");

const app = new express();
app.use(cors());
app.use(express.json());

const GetUser = require("./res/user.js");
const GetGuilds = require("./res/guild.js");
const Database = require("./db/db.js");
const {
  clientID,
  clientSecret,
  PORT,
  BOT_TOKEN,
  DB_URL,
  DB_NAME,
  URL,
} = require("./settings.js");
const CreateWebhook = require("./res/createwebhook.js");

let db;
Database.connect(DB_URL, DB_NAME)
  .then((res) => {
    if (!res) {
      return console.log(`Can't connect to database`);
    }
    db = res;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(console.log);

app.all("/", async (request, res) => {
  const code = request.query.code;
  if (code) {
    try {
      const oauthData = await fetch("https://discord.com/api/oauth2/token", {
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
      })
        .then((r) => r.json())
        .catch((err) => {
          console.log(err);
          return res.send({ code: 1004, data: "Error on our Side" });
        });
      if (!oauthData.access_token) {
	console.log(oauthData)
        return res.send({ code: 1003, data: "Invalid response" });
      }
      const SaveData = oauthData;
      SaveData.time = Date.now();
      SaveData.hash = md5(oauthData.access_token);
      await db.SetToken(SaveData).catch((err) => {
        console.log(err);
        return res.send({ code: 1004, data: "Error on our Side" });
      });
      const data = {};
      data.user = await GetUser(oauthData);
      data.hash = SaveData.hash;
      data.code = 200;
      res.send(data);
    } catch (error) {
      console.log(error);
    }
  } else {
    res.send({ code: 1002, data: "No code provided" });
  }
});
app.all("/user", async (req, res) => {
  const token = req.query.token;
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
          return res.send({ code: 1004, data: "Error on our Side" });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.send({ code: 1004, data: "Error on our Side" });
    });
});
app.all("/guilds", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.send({ code: 1002, data: "No token provided" });
  }
  try {
    db.GetToken(token)
      .then((oauthData) => {
        if (!oauthData) {
          return res.send({
            code: 1003,
            data: "No results found for this token",
          });
        }
        GetGuilds(oauthData)
          .then(async (rawList) => {
            let listOfGuilds = await GetDiscordGuilds();
            let commonList = GetCommonGuilds(listOfGuilds, rawList);
            const finalList = [];
            commonList.forEach((gg) => {
              if (
                (gg.permissions & 0x0000000008) == 0x0000000008 ||
                (gg.permissions & 0x0000000020) == 0x0000000020
              ) {
                finalList.push(gg);
              }
            });
            res.send(finalList);
          })
          .catch((err) => {
            console.log(err);
            return res.send({ code: 1004, data: "Error on our Side" });
          });
      })
      .catch((err) => {
        console.log(err);
        return res.send({ code: 1004, data: "Error on our Side" });
      });
  } catch (err) {
    console.log(err);
    return res.send({ code: 1004, data: "Error on our Side" });
  }
});

app.all("/bot/guild", async (req, res) => {
  let token = req.query.token;
  let guild = req.query.guild;
  let FinalData;
  if (!token) {
    return res.send({ code: 1002, data: "No token provided" });
  }
  if (!guild) {
    return res.send({ code: 1002, data: "No guild id provided" });
  }
  token = token.toString();
  guild = guild.toString();
  try {
    db.GetToken(token)
      .then(async (oauthData) => {
        if (!oauthData) {
          return res.send({ code: 1005, data: "Invalid request" });
        }
        FinalData = await GetSpecifictDiscordGuild(guild);
        FinalData.channels = await GetDiscordChannels(guild);
        FinalData.current = await GetCurrentData(guild);
        FinalData.code = 200;
        res.send(FinalData);
      })
      .catch((err) => {
        console.log(err);
        return res.send({ code: 1004, data: "Error on our side" });
      });
  } catch (err) {
    return res.send({ code: 1004, data: "Error on our Side" });
  }
});

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
          nr.memes = await CreateWebhook(
            "Plubin - Memes",
            req.body.memes.channel
          );
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
          nr.nsfw = await CreateWebhook("Plubin - NSFW", req.body.nsfw.channel);
          nr.nsfw.channel = nr.nsfw.channel_id;
          nr.nsfw.guild = nr.nsfw.guild_id;
        }
        db.SetGuildData(nr)
          .then((result) => {
            if (result) {
              return res.send({ code: 200, data: "All good" });
            } else {
              return res.send({ code: 200, data: "All good" });
            }
          })
          .catch((err) => {
            console.log(err);
            return res.send({ code: 1004, data: "Error on our side" });
          });
      } else {
        if (
          !req.body.memes ||
          !req.body.memes.channel ||
          req.body.memes.channel == "0" ||
          (!g.memes && !req.body.memes.channel) ||
          req.body.memes.channel == g.memes.channel
        ) {
          nr.memes = g.memes; //Old value
        } else {
	  let aer;
          nr.memes = await CreateWebhook(
            "Plubin - Memes",
            req.body.memes.channel
          ).catch(err => aer = err)
	  if(aer){
	    return res.send({ code: 1006, data: "Permission denied" })
	  }
          nr.memes = {};
          nr.memes.channel = nr.memes.channel_id;
          nr.memes.guild = nr.memes.guild_id;
        }
        if (
          !req.body.nsfw ||
          !req.body.nsfw.channel ||
          req.body.nsfw.channel == "0" ||
          req.body.nsfw.channel == g.nsfw.channel
        ) {
          nr.nsfw = g.nsfw; //old value
        } else {
          nr.nsfw = await CreateWebhook("Plubin - NSFW", req.body.nsfw.channel);
          nr.nsfw = {};
          nr.nsfw.channel = nr.nsfw.channel_id;
          nr.nsfw.guild = nr.nsfw.guild_id;
        }
        db.UpdateGuildData(guild, nr)
          .then((result) => {
            //console.log(result)
            if (result) {
              return res.send({ code: 200, data: "All good" });
            } else {
              return res.send({ code: 200, data: "All good" });
            }
          })
          .catch((err) => {
            console.log(err);
            return res.send({ code: 1004, data: "Error on our side" });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.send({ code: 1004, data: "Error on our side" });
    });
});

const GetCommonGuilds = (discordGuilds, guildList) => {
  const _final = [];
  discordGuilds.forEach((_g) => {
    let _a = guildList.find((_ar) => _ar.id === _g.id);
    if (_a) {
      _final.push(_a);
    }
  });
  return _final;
};

const GetDiscordGuilds = () => {
  return new Promise((resolve, reject) => {
    fetch("https://discord.com/api/v9/users/@me/guilds", {
      method: "GET",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    })
      .then((r) => r.json())
      .then((result) => {
        resolve(result);
      })
      .catch(reject);
  });
};
const GetSpecifictDiscordGuild = (_guild_id) => {
  return new Promise((resolve, reject) => {
    if (!_guild_id) {
      reject("No guild ID");
    }
    fetch("https://discord.com/api/v9/users/@me/guilds", {
      method: "GET",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    })
      .then((r) => r.json())
      .then((result) => {
        let a = result.find((x) => x.id === _guild_id);
        resolve(a);
      })
      .catch(reject);
  });
};
const GetDiscordChannels = (_guild_id) => {
  return new Promise((resolve, reject) => {
    if (!_guild_id) {
      reject("No guild ID");
    }
    fetch(`https://discord.com/api/v9/guilds/${_guild_id}/channels`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    })
      .then((r) => r.json())
      .then((res) => {
        const allC = [];
        res.forEach((c) => {
          if (c.type == 0) {
            let v = {
              id: c.id,
              name: c.name,
              nsfw: c.nsfw,
            };
            allC.push(v);
          }
        });
        resolve(allC);
      })
      .catch(reject);
  });
};

const GetCurrentData = async (_guild_id) => {
  return new Promise((resolve, reject) => {
    if (!_guild_id) {
      reject("No guild ID");
    }
    db.GetGuildData(_guild_id)
      .then((res) => {
        resolve(res);
      })
      .catch(reject);
  });
};

/*
Error codes:
- 1002: Missing Information (Not enough data provided)
- 1003: No Data (No Data Found for that query)
- 1004: Server side error (Server Crashed to process the query)
- 1005: Probably frawd
*/
