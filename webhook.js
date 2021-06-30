const reddit = require('reddit-image-fetcher')
const fetch = require('node-fetch')

const BaseURL = 'https://discord.com/api'

const SendWebhook = (_embeds, _id, _token) => {
    fetch(`${BaseURL}/webhooks/${_id}/${_token}`, {
	method: "POST",
	body: JSON.stringify({
	    username: `Plubin - meme`,
	    avatar_url: `https://i.imgur.com/srjyh7d.png`,
	    embeds: _embeds
	}),
	headers: {
	    'Content-Type': 'application/json',
	    'User-Agent': 'MOZILA'
	}
    }).catch(console.log)
}
const Send = async (AllGuilds) => {
    let rp_memes = await reddit.fetch({
        type: 'custom',
	    total: '10',
	    subreddit: ['memes', 'dankmemes', 'goodanimemes']
    })
    let rp_nsfw = await reddit.fetch({
        type: 'custom',
	    total: '10',
	    subreddit: ['hentai', 'tentai']
    })
    let ro_memes = []
    let ro_nsfw = []
    rp_memes.forEach(rr => {
	    if(!rr.image){ return false } 
	        let aaa = {}
	        aaa.image = {
	            url: rr.image
	        }
	    aaa.title = rr.title
	    ro_memes.push(aaa)
    })
    rp_nsfw.forEach(rr => {
	    if(!rr.image){ return false } 
	        let aaa = {}
	        aaa.image = {
	            url: rr.image
	        }
	    aaa.title = rr.title
	    ro_nsfw.push(aaa)
    })
    AllGuilds.forEach(g => {
        if(g.memes && g.memes.id){
    	    SendWebhook(ro_memes, g.memes.id, g.memes.token)
            console.log('sent memes')
        }
        if(g.nsfw && g.nsfw.id){
            console.log('sent nsfw')
    	    SendWebhook(ro_nsfw, g.nsfw.id, g.nsfw.token)
        }
    })
}

module.exports = async (db) => {
    db.GetAllGuildData().then(_allGuilds => {
        Send(_allGuilds)
        console.log("Sending webhook")
    }).catch(console.log)
}