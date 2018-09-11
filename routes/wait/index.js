module.exports = function(app){

    const express = require('express');
    const cookieParse = require('cookie-parse');
    const router = express.Router();
    const namespace = app.io.of('/wait');
    const nextActiveConsumer = app.nextActiveConsumer;
    const monitoringConsumer = app.monitoringConsumer;

    var rooms = [];

    var waitNumbers = 0;
    var waitMinutes = 0;

	router.get('/wait', function(req, res){
        res.sendFile(req.app.clientDir + '/wait.html');
    });

    namespace.on('connection', (socket) => {
        const cookie = cookieParse.parse(socket.handshake.headers.cookie);

        socket.uuid = cookie.uuid;

        if (socket.uuid) rooms.push(socket.uuid);
        else socket.disconnect(true);

        //seq 별로 room을 만듬
        socket.join(socket.uuid, () => {
            let rooms = Object.keys(socket.rooms);
            socket.emit('client connected', socket.uuid);
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
            console.log(socket.uuid + ' disconnected. ' + reason);
            removeWaiting(socket.uuid);
        });
    });

    //카프카 컨슈머
    monitoringConsumer.on('message', function (message) {
        const value = JSON.parse(message.value);
       
        waitNumbers = value.waiting;
        waitMinutes = value.waiting * 3;

        namespace.emit('wait number', waitNumbers);
        namespace.emit('wait minute', waitMinutes);
    });
     
    monitoringConsumer.on('error', function (err) {
        console.log('error', err);
    });

    nextActiveConsumer.on('message', function (message) {
        console.log(message.value);
        const value = JSON.parse(message.value);

        passWaiting(value.uuid);
    });
    
    nextActiveConsumer.on('error', function (err) {
        console.log('error', err);
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
     * @param {*} uuid 
     */
    function passWaiting (uuid) {
        namespace.to(uuid).emit('pass', msg);
    }

    /**
     * 대기열에서 제거
     * @param {*} uuid 
     */
    function removeWaiting (uuid) {
        
    }

	return router;
};