module.exports = function(app){

	var express = require('express');
    var router = express.Router();
    const namespace = app.io.of('/wait');
    
    var seq = '';
    var rooms = [];

    var waitNumbers = 0;
    var waitMinutes = 0;

	router.get('/wait', function(req, res){
        seq = req.query.seq;
        res.sendFile(req.app.clientDir + '/wait.html');
    });

    namespace.on('connection', (socket) => {
        socket.seq = seq;
        if (socket.seq) rooms.push(seq);
        else socket.disconnect(true);

        //seq 별로 room을 만듬
        socket.join(socket.seq, () => {
            let rooms = Object.keys(socket.rooms);
            socket.emit('client connected', socket.seq);

            const { num, minutes } = getWaitingInfo();
            waitNumbers = num;
            waitMinutes = minutes;

            socket.emit('wait number', waitNumbers);
            socket.emit('wait minute', waitMinutes);
        });

        //클라이언트 연결 완료
        socket.on('client connected', (msg) => {
            namespace.emit('client connected', msg);
        });

        //대기열 통과
        socket.on('pass', (msg) => {
            socket.emit('pass', msg);
        });

        //대기시간 업데이트
        socket.on('wait minute', (minute) => {
            namespace.emit('wait minute', minute);
        });

        //대기인원 업데이트
        socket.on('wait number', (number) => {
            namespace.emit('wait number', number);
        });

        //소켓 연결 종료
        socket.on('disconnect', (reason) => {
            console.log(socket.seq + ' disconnected. ' + reason);
            removeWaiting(socket.seq);
        });
    });

    /**
     * 대기인원수, 대기시간 조회
     */
    function getWaitingInfo () {
        const num = 0;
        const minutes = 1;
        return {
            num, 
            minutes
        };
    }

    /**
     * 대기열 통과
     * @param {*} seq 
     */
    function passWaiting (seq) {
        namespace.to(seq).emit('pass', msg);
    }

    /**
     * 대기열에서 제거
     * @param {*} seq 
     */
    function removeWaiting (seq) {
        
    }

	return router;
};