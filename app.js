const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { HighLevelConsumer, Client } = require('kafka-node');

app.io = io;
app.clientDir = __dirname + '/client';

var topic = 'monitoring';
var client = new Client('59.6.40.128:2181');
var topics = [{ topic: topic }];
var options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024, groupId: 'dlwlsgkdn' };
var consumer = new HighLevelConsumer(client, topics, options);

app.consumer = consumer;

app.use(require('./routes/index.js')(app));
app.use(require('./routes/wait/index.js')(app));

http.listen(3000, () => {
  console.log('Connected at 3000');
});