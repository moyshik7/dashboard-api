/*
default OauthData
{
	"access_token": "an access token",
	"token_type": "Bearer",
	"expires_in": 604800,
	"refresh_token": "a refresh token",
	"scope": "identify"
}
*/
/*
Default user type
{
    id: '1000000000001',
    username: 'akio',
	discriminator: '4209',
	avatar: 'https://blahhhhhh'
}
*/
const fetch = require("node-fetch");

module.exports = (oauthData) => {
  return new Promise((resolve, reject) => {
    fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: `${oauthData.token_type} ${oauthData.access_token}`,
      },
    })
      .then((r) => r.json())
      .then((res) => {
        const user = {};
        user.id = res.id;
        user.username = res.username;
        user.discriminator = res.discriminator;
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
