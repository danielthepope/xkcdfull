# xkcdfull
Finally, a quick hack that actually resulted in something!

Where I work, we have some TV screens that show things like the status of builds and which servers are misbehaving. It also shows occasional funnies, including a random xkcd, which at the moment is the entire page, often so small it is unreadable.

This site enlarges the comics so that they fit to the screen.

## Endpoints
- [/](http://xkcd.danielthepope.co.uk/): Picks a random xkcd comic. Add `?rotate=60` to get a new comic every minute (or however many seconds you want).
- [/latest](http://xkcd.danielthepope.co.uk/latest): Displays the most recent comic.
- [/149](http://xkcd.danielthepope.co.uk/149) (or any other number): Displays the specified comic.

You can add `?full` to all endpoints to display the comics without text.

## Run your own server
```
npm install
npm start
```
Runs on the port specified by the PORT environment variable, or if not set, it defaults to 3000.
