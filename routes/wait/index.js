module.exports = function(app){

    const express = require('express');
    const cookieParse = require('cookie-parse');
    const axios = require('axios');
    const router = express.Router();
    const namespace = app.io.of('/wait');
    const webServerHost = app.webServerHost;
    const nextActiveConsumer = app.nextActiveConsumer;
    const monitoringConsumer = app.monitoringConsumer;

    var rooms = [];

    var waitNumbers = 0;
    var waitMinutes = 0;

	router.get('/wait', function(req, res){
        res.sendFile(req.app.clientDir + '/wait.html');
    });

    namespace.on('connection', (socket) => {
        //const cookieStr = socket.handshake.headers.cookie || '';
        //const cookie = cookieParse.parse(cookieStr);
        //socket.uuid = cookie.uuid;

        socket.uuid = socket.handshake.query.uuid;

        if (socket.uuid) rooms.push(socket.uuid);
        else socket.disconnect(true);

        //seq 별로 room을 만듬
        socket.join(socket.uuid, () => {
            const { exp, seq } = getWaitingInfo(socket.uuid);
            socket.seq = exp;
            socket.seq = seq;
            socket.emit('client connected', { uuid : socket.uuid, seq : socket.seq, exp : socket.exp });
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
        socket.on('wait time', (number) => {
            const waitminutes = socket.seq - number;
            namespace.emit('wait time', waitminutes * 30);
        });

        //대기인원 업데이트
        socket.on('wait number', (number) => {
            console.log('2');
            const waitnum = socket.seq - number;
            namespace.emit('wait number', waitnum);
        });

        //소켓 연결 종료
        socket.on('disconnect', (reason) => {
            console.log(socket.uuid + ' disconnected. ' + reason);
            removeWaiting(socket.uuid);
        });
    });

    //카프카 컨슈머
    monitoringConsumer.on('message', function (message) {
        //console.log(message.value);
        const value = JSON.parse(message.value);
       
        waitNumbers = value.nextWaitingSeq;
        waitTime = value.nextWaitingSeq;

        namespace.emit('wait number', waitNumbers);
        namespace.emit('wait time', waitTime);
    });
     
    monitoringConsumer.on('error', function (err) {
        console.log('error', err);
    });

    nextActiveConsumer.on('message', function (message) {
        //console.log(message.value);
        const value = JSON.parse(message.value);

        passWaiting(value.guid);
    });
    
    nextActiveConsumer.on('error', function (err) {
        console.log('error', err);
    });

    /**
     * 대기인원수, 대기시간 조회
     */
    function getWaitingInfo (uuid) {
        return axios.get('http://' + webServerHost + ':3001' + '/get/' + uuid)
            .then(function (response) {
                const data = response.data;
                console.log(data);
                return data;
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function (data) {
                return {
                    exp : data.exp,
                    seq : data.seq
                };
            });
    }

    /**
     * 대기열 통과
     * @param {*} uuid 
     */
    function passWaiting (uuid) {
        namespace.to(uuid).emit('pass', 'pass' + uuid);
    }

    /**
     * 대기열에서 제거
     * @param {*} uuid 
     */
    function removeWaiting (uuid) {
        axios.get('http://' + webServerHost + ':3001' + '/remove/' + uuid)
            .then(function (response) {
                const data = response.data;
                console.log(data);
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function (data) {
            });
    }

	return router;
};