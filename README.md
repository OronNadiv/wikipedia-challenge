#Wikipedia Challenge - Find the shortest path between two Wikipedia pages

[![Dependencies][dependencies-image]][dependencies-url]
[![JavaScript Style Guide][standard-image]][standard-url]  

This application is inspired by [Ran Levi][ran-levi]'s Wikipedia challenge in his famous podcast, [Curious Minds][cmpod], in which Ran asks the listeners to find the shortest path between two Wikipedia pages.

## Prerequisites
#### Download and install the following tools:
1. [Node JS][node-js] 6.x (or higher).
2. [PostgreSQL DB][postgres] v9.2 (or higher).
3. [Rabbit Message Queue][rmq] (RMQ) v3.6.x (or higher).

* After successful installation, make sure Postgres and RMQ are running.

#### Once you have completed the previous step, you need to run the following commands from the source's root directory:
1. `npm install` - installs all NPM packages specified in `package.json`.
2. `npm run migrate up` - creates the database tables.

#### Environment Variables (configuration):
* __DATABASE_URL__ - the URL to PostgreSQL DB.  Default value: `postgres://postgres:@localhost/postgres`
* __AMQP_URL__ - the URL to RMQ.  Default value: `amqp://guest:guest@localhost:5672`
* __LOG_LEVEL__ - log level.  Values: `error`/`warn`/`info`/`verbose`/`debug`/`silly`.  Default value: `info`

## The application is combined of three parts

### Downloader
Web crawler that downloads all Wikipedia pages and stores them on the disk for future processing.

##### Running instructions
From the source root directory, run:
<br/>`npm run downloader`
<br/>You may run several downloaders at the same time to speed up the download process.

### Processor
Tool that processes the downloaded pages.  The downloaded pages are stored on the local drive while a process job is pushed into the RMQ.  The processor takes an item from RMQ and extracts all links from the page, then it will push more download jobs into RMQ to be processed by the downloaders.

##### Running instructions
From the source root directory, run:
<br/>`npm run processor`
<br/>You should _NOT_ run multiple processors at the same time.

### Finder
Once the `downloaders` and the `processor` are done (may take a few hours), the finder will use the indexed pages to find the shortest path from any given two Wikipedia pages using Breadth-first search (BFS) algorithm.

##### Running instructions
From the source root directory, run:
<br/>`npm run finder <LINK-START> <LINK-END>`

Where:
* \<LINK-START\> is the URL to the "start" Wikipedia page.
* \<LINK-END\> is the URL to the "finish" Wikipedia page.

Example:
<br/>`npm run finder https://he.wikipedia.org/wiki/%D7%95/%D7%90%D7%95 https://he.wikipedia.org/wiki/Can%27t_Buy_Me_Love`

### License
[MIT](https://tldrlegal.com/license/mit-license)

[dependencies-image]: https://img.shields.io/david/OronNadiv/wikipedia-challenge.svg?style=flat-square
[dependencies-url]: https://david-dm.org/OronNadiv/wikipedia-challenge
[ran-levi]: http://www.ranlevi.com/
[cmpod]: http://www.cmpod.net/
[node-js]: https://nodejs.org/en/
[postgres]: https://www.postgresql.org/
[rmq]: https://www.rabbitmq.com/
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com
