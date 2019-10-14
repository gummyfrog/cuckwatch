var Twitter = require('twitter');
var clientKeychain = json.readFileSync('../codes/cuckwatch/code.json');

class CuckWatch {

	constructor() {
		this.client = new Twitter(clientKeychain);;
		this.stream;

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
		  	console.log(`Encountered error while retweeting a tweet. ${error}`)
		  } else {
			console.log(tweet.text);
		  }
		});	
	}

	likeTweet(id, username) {
		this.client.post('favorites/create', {id: id}, (error, tweet, response) => {
		  if(error) {
		  	console.log(`Encountered error while liking a tweet. ${error}`)
		  } else {;	  
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

}


var cuckWatch = new CuckWatch();
cuckWatch.startStream();
