# xkcdfull
Finally, a quick hack that actually resulted in something!

Where I work, we have some TV screens that show things like the status of builds and which servers are misbehaving. It also shows occasional funnies, including a random xkcd, which at the moment is the entire page, often so small it is unreadable.

This site enlarges the comics so that they fit to the screen.

## Paths
- `/`: Picks a random xkcd comic
- `/latest`: Displays the most recent comic
- `/149` (or any other number): Displays the specified comic.

## Run your own server
```
npm install
npm start
```
Runs on port 3000, because I hard coded it, because this is a dirty hack.
