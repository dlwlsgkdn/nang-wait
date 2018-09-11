const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.io = io;
app.clientDir = __dirname + '/client';

app.use(require('./routes/index.js')(app));
app.use(require('./routes/wait/index.js')(app));

http.listen(3000, () => {
  console.log('Connected at 3000');
});

var kafka = require('kafka-node');

var HighLevelConsumer = kafka.HighLevelConsumer;
var Client = kafka.Client;
var topic = 'monitoring';
var client = new Client('172.30.1.1:2181');
var topics = [{ topic: topic }];
var options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024, groupId: 'dlwlsgkdn' };
var consumer = new HighLevelConsumer(client, topics, options);
console.log('hi')
consumer.on('message', function (message) {
   console.log(message);
});

consumer.on('error', function (err) {
   console.log('error', err);
});