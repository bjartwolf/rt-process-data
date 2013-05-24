Code featured in my NDC2013 magazine article
============================================

![Magazine image](http://www.programutvikling.no/images//TheDeveloper/The%20Developer%202nd%20edition.jpg)

[Link to magazine](http://www.programutvikling.no/artikkel/om-oss/the-developer/2613)

This article was mostly inspired by

[Substack's streams handbook](https://github.com/substack/stream-handbook) I guess I took more than a little inspiration from here, like borrowing some quotes and so on.

[NodeCopter](http://nodecopter.com/)

And thanks to [einarwh](https://twitter.com/einarwh) for helping me with the text.

Install
-------
You need a recent node version (0.10+)

git clone https://github.com/bjartwolf/rt-process-data
cd rt-process-data
npm install
node server

To build levelDB on Windows you also need to google a bit (it happens during npm install, so if that fails you might need to download some more stuff)

There are three examples

1. Streaming real-time data to console 
--------------------------------------
Just uncomment the lines where stream is piped to stdout

2. Streaming real-time data to http 
-----------------------------------
Open your browser and go to: http://localhost:3000/rt
Some browser work better than others for this, Chrome does a good
job.

3. Serve historical data 
------------------------
Open your browser and go to: http://localhost:3000/history

4. Serve historical and real-time data 
--------------------------------------
Open your browser and go to: http://localhost:3000/historyAndRt

