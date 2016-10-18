# xkcdfull
Finally, a quick hack that actually resulted in something!

Where I work, we have some TV screens that show things like the status of builds and which servers are misbehaving. It also shows occasional funnies, including a random xkcd, which at the moment is the entire page, often so small it is unreadable.

This site enlarges the comics so that they fit to the screen.

## Paths
- [/](http://xkcd.danielthepope.co.uk/): Picks a random xkcd comic
- [/latest](http://xkcd.danielthepope.co.uk/latest): Displays the most recent comic
- [/149](http://xkcd.danielthepope.co.uk/149) (or any other number): Displays the specified comic
- [/rotate](http://xkcd.danielthepope.co.uk/rotate): Automatically refreshes every minute
- [/imageonly](http://xkcd.danielthepope.co.uk/imageonly): Just the image; no text (and no flexbox)

## Run your own server
```
npm install
npm start
```
Runs on the port specified by the PORT environment variable, or if not set, it defaults to 3000.
