var Updater = require('./updater.js');
var Twitter = require('twitter');
var axios = require('axios')
var nodeCleanup = require('node-cleanup');
var json = require('jsonfile');
var clientKeychain = json.readFileSync('../codes/cuckwatch/code.json');

class CuckWatch {

	constructor() {
		this.updater = new Updater();
		this.updater.name = "cuckwatch";
		this.updater.desc = "Cuck Retweeter.";
		this.storage = json.readFileSync('./storage.json');
		this.client = new Twitter(clientKeychain);;
		this.stream;

		setInterval(function() {
			this.update();
		}.bind(this), 10 * 1000);

		setInterval(function() {
			this.startStream(); 
		}.bind(this) , 60 * 60 * 1000);

		setTimeout(function() {
			this.startStream(); 
		}.bind(this), 3 * 1000);

	}

	retweetTweet(id, username) {
		this.client.post('statuses/retweet', {id: id}, (error, tweet, response) => {
		  if(error) {
		  	console.log('Encountered an error while retweeting.');
		 	console.log(error)
		  } else {
			this.storage.cuckCount+=1;
			console.log(tweet.text);
		  }
		});	
	}

	likeTweet(id, username) {
		this.client.post('favorites/create', {id: id}, (error, tweet, response) => {
		  if(error) {
		  	console.log(`Encountered error while liking a tweet. ${error}`)
		  } else {;	  
			this.storage.favoriteCount+=1;
			console.log(tweet.text);  
		  }
		});	
	}


	determineTweetType(tweet) {
	  if (tweet.in_reply_to_status_id) {
	    return ('reply');
	  }
	  if (tweet.quoted_status_id) {
	    return ('quote');
	  }
	  if (tweet.retweeted_status) {
	    return ('retweet'); 
	  }
	  return ('tweet');
	};


	startStream() {
		if(this.stream != null) {
			this.stream.destroy();
		}

		this.stream = this.client.stream('statuses/filter', {track: 'cuck,cucks'});
		console.log('Stream Started.');
		
		this.stream.on('data', (event) => {
			console.log(`${event.text} https://twitter.com/statuses/${event.id_str}`);
			if(event.text.indexOf('#') == -1 && event.text.indexOf("http") == -1) {			
				if(this.determineTweetType(event) == 'tweet') {
					this.retweetTweet(event.id_str, event.user.screen_name, event.user.id_str);
				} else {
					if(Math.floor(Math.random() * 5) == 1) {
						this.likeTweet(event.id_str, event.user.screen_name);
					}
				}
			};
		});

		this.stream.on('error', (error) => {
			console.log(error);
		});
	}

	update() {
 		this.updater.post(
			{
				"status": 'online', 
				"cucks-retweeted": this.storage.cuckCount, 
				"cucks-liked": this.storage.favoriteCount,
			})
		.catch((e) => {
			// console.log("Site offline or invalid URL.");
			// silenced
		})
	}

}


var cuckWatch = new CuckWatch();
cuckWatch.startStream();

nodeCleanup((exitCode, signal) => {
  if (signal) {
	cuckWatch.stream.destroy();
	json.writeFileSync('./storage.json', cuckWatch.storage);

    cuckWatch.updater.post({'status':'offline'})
	    .then(() => {
	    	console.log('Posted the offline message.')
	      	process.kill(process.pid, signal);
	    })
	    .catch((e) => {
	    	console.log("Site offline or invalid url for cleanup... Whoops!");
	      	process.kill(process.pid, signal);
	   	})
	  nodeCleanup.uninstall();
	  return false;
  }
});

//0000x00000