module.exports = function(app){//함수로 만들어 객체 app을 전달받음
	var express = require('express');
    var router = express.Router();
    const namespace = app.io.of('/index');
    
	router.get('/index', function(req, res){
        res.sendFile(req.app.clientDir + '/index.html');
    });

    namespace.on('connection', (socket) => {
        console.log(socket.id + ' connected');
        namespace.emit('news', { hello: "Someone connected at namespace index" });

        //소켓 연결 클라이언트
        namespace.clients((error, clients) => {
            if (error) throw error;

            var idx = clients.length - 1;
            if (idx != -1) {
                namespace.emit('client connected', clients[idx]);
            }    
        });

        //클라이언트 연결 완료
        socket.on('client connected', (msg) => {
            namespace.emit('client connected', msg);
        });

        socket.on('chat message', (msg) => {
            namespace.emit('chat message', msg);
        });
        
        //소켓 연결 종료
        socket.on('disconnect', (reason) => {
          console.log(socket.id + ' disconnected. ' + reason);
        });
    });

	return router;	//라우터를 리턴
};