const { v4: uuidv4 } = require('uuid');
const {setRedisValue, getRedisValue, setRedisJSONValue} = require('./redis');

class NewRoom {
    constructor(id, users) {
        this.id = id;
        this.users = users ? users : [];
    }

    toJSON() {
        return {
            id: this.id,
            users: this.users
        }
    }
}

class RoomWithoutGame extends NewRoom {
    constructor(id, users) {
        super(id, users);
        this.isPlaying = false;
    }

    toJSON() {
        return {
            id: this.id,
            isPlaying: this.isPlaying,
            users: this.users
        }
    }
}

class RoomWithGame extends RoomWithoutGame {
    constructor(id, users, word, mask, mistakes) {
        super(id, users);
        this.isPlaying = true;
        this.word = word ? word : undefined;
        this.mask = mask ? mask : '';
        this.mistakes = mistakes ? mistakes : 0;
    }

    getMistakes() {
        return this.mistakes;
    }

    addWordToRoom(word) {
        this.word = word;
    }

    addLetter(letter) {
        this.mask = this.mask + letter;
    }

    addMistake() {
        this.mistakes++;
    }

    toJSON() {
        return {
            id: this.id,
            isPlaying: this.isPlaying,
            word: this.word,
            mask: this.mask,
            mistakes: this.mistakes,
            users: this.users
        }
    }
}

function RoomService () { }

RoomService.prototype.createRoom = function () {
    const id = uuidv4();

    const room = new NewRoom(id);

    setRedisValue(id, JSON.stringify(room.toJSON()));

    return room;
}

RoomService.prototype.setRoomWord = async function (word, roomID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    const room = new RoomWithGame(roomData.id, roomData.users);

    room.addWordToRoom(word);

    setRedisValue(roomID, JSON.stringify(room.toJSON()));

    return true;
}

RoomService.prototype.addLetter = async function (letter, roomID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    const room = new RoomWithGame(roomData.id, roomData.users, roomData.word, roomData.mask, roomData.mistakes);

    console.log(letter);

    room.addLetter(letter);

    setRedisValue(roomID, JSON.stringify(room.toJSON()));

    return true;
}

RoomService.prototype.addMistake = async function (roomID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    const room = new RoomWithGame(roomData.id, roomData.users, roomData.word, roomData.mask, roomData.mistakes);

    room.addMistake();

    setRedisValue(roomID, JSON.stringify(room.toJSON()));

    return room.getMistakes();
}

RoomService.prototype.resetGame = async function (roomID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    const room = new RoomWithoutGame(roomData.id, roomData.users);

    setRedisValue(roomID, JSON.stringify(room.toJSON()));

    return true;
}

RoomService.prototype.addUserToRoom = async function (roomID, username, socketID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    const room = new RoomWithoutGame(roomData.id, [...roomData.users, {username, userID: socketID}]);

    setRedisValue(roomID, JSON.stringify(room.toJSON()));

    return true;
}

RoomService.prototype.getRoomUsers = async function (roomID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    const room = new RoomWithoutGame(roomData.id, roomData.users);

    return room.users ? room.users : [];
}

RoomService.prototype.userDisconnect = async function (roomID, socketID) {
    const roomData = JSON.parse(await getRedisValue(roomID));
    let room = null;

    if (roomData.isPlaying) {
       room = new RoomWithGame(roomData.id, roomData.users, roomData.word, roomData.mask, roomData.mistakes);
    } else {
        room = new RoomWithoutGame(roomData.id, roomData.users);
    }

    const userIndex = room.users.findIndex(user => user.userID === socketID);
    const deleteUser = {...room.users[userIndex]};
    const copyUserArray = [...room.users];

    copyUserArray.splice(userIndex, 1);
    room.users = [...copyUserArray]

    setRedisValue(roomID, JSON.stringify(room.toJSON()));

    return deleteUser;
}

module.exports = {
    RoomService: RoomService
}
