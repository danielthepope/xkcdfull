# xkcdfull
Finally, a quick hack that actually resulted in something!

Where I work, we have some TV screens that show things like the status of builds and which servers are misbehaving. It also shows occasional funnies, including a random xkcd, which at the moment is the entire page, often so small it is unreadable.

This site enlarges the comics so that they fit to the screen.

## Endpoints
- [/](http://xkcd.dpope.uk/): Picks a random xkcd comic. Add `?rotate=60` to get a new comic every minute (or however many seconds you want).
- [/latest](http://xkcd.dpope.uk/latest): Displays the most recent comic.
- [/149](http://xkcd.dpope.uk/149) (or any other number): Displays the specified comic.

You can add `?full` to all endpoints to display the comics without text.

## Is it suitable for work?
Probably? So long as you're not easily offended. Comics picked by [https://xkcd.dpope.uk/](https://xkcd.dpope.uk/) won't have bad words, but that doesn't mean they'll be free of unsuitable themes.

## Run your own server
```
npm install
npm start
```
Runs on the port specified by the PORT environment variable, or if not set, it defaults to 3000.

If you want to make sure the comics provided don't contain any naughty words, you can specify the `BLOCKED_WORDS` environment variable, giving your words as a comma-separated list.

e.g. `BLOCKED_WORDS=linux,sudo npm start` will make sure that any randomly selected comics don't contain 'linux' or 'sudo' in their titles, transcripts and mouseover text.
