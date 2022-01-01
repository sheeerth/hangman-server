var express = require('express');
var router = express.Router();
const {RoomService} =  require("../services/rooms.service");
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/new', function(req, res, next) {
    const service = new RoomService();
    const id = service.createRoom();

    res.json({
        id
    });
});

module.exports = router;
