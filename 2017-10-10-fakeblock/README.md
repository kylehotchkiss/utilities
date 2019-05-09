## FakeBlock

![http://www.abine.com/blog/wp-content/uploads/2013/05/its-called-FakeBlock.png](http://www.abine.com/blog/wp-content/uploads/2013/05/its-called-FakeBlock.png)

A small react script that will help you bulk-clean your twitter feed. I used it to remove about 24,000 tweets.

I've been using Twitter almost a decade and I've said a lot of stupid things there. I've grown as a person and realized the gravity of words--and looking back at my own history--I was shocked at the things I said. As I get older, I'm trying to get more intensional about what I share online. I don't want to delete everything, I want to keep the span of tweets, while reducing the bulk.

### Why

* Social Engineering

I don't want people using my past tweets in social engineering hacks with call center people. That was the primary reason I created this.

* Professionalism and Modesty

People read your public profile to make decisions about you. Present yourself well!

* Nation-state Monitoring

If you travel around the world, realize your public Twitter account is likely monitored as reciprocal policy due the US' social media monitoring of all foreigners. And you've probably tweeted at least one thing that could be used against you in non-western countries courts ;) 

Realize that this tool will not remove your tweets from history, as they likely still exist in Twitter's Database in deleted state, and can probably be dug up via an internet history tool. However, this will remove tweets from Twitter's enterprise search tools, which are far more powerful that the search we generally deal with on Twitter.

* Advertising

I'm actually not sure about this, but I imagine not having tens of thousands of thoughts associated with your online identity helps reduce the things they can infer about you.

### How it works

* Flags any tweets containing words from Blacklist as deleted
* Lets you only keep 5 tweets a month for every month before 1 year ago. You can pick the ones you keep. 

1) pull
2) `yarn install`
3) `yarn start`
4) `http://localhost:3000`
5) Download your twitter archive. Back it up! Put it somewhere where you can show your kids one day and laugh
6) Grab the CSV file from your archive and upload in your browser
7) You will have to manually approve each month of tweets before the last year. You can remove tweets from this view but a new random set is pulled each time you do this.
8) After all the months have been moderated, you get a block of code you can past in Chrome inspector to delete em all at once. I could get about 24,000 in one go. The internal API isn't rate limited.
9) Enjoy your reduced (but not eliminated) twitter presence :)