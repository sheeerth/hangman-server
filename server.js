const createError = require('http-errors');
const express = require('express');
const { createServer } = require("http");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { Server } = require("socket.io");
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const roomsRouter = require('./routes/rooms');
const {RoomService} =  require("./services/rooms.service");
const app = express();
const fs = require('fs');
const cors = require("cors");

const wordsBase = [];

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(logger('dev'));
app.use(cors({
  origin: '*'
}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/room', roomsRouter);

const animals = [
  'Ant',
  'Antelope',
  'Baboon',
  'Bat',
  'Beagle',
  'Bear',
  'Bird',
  'Butterfly',
  'Cat',
  'Caterpillar',
  'Chicken',
  'Cow',
  'Dog',
  'Dolphin',
  'Donkey',
  'Eagle',
  'Fish',
  'Fly',
  'Fox',
  'Frog',
  'Gerbil',
  'Goose',
  'Gopher',
  'Gorilla',
  'Heron',
  'Honey Bee',
  'Horn Shark',
  'Horse',
  'Ibis',
  'Iguana',
  'Impala',
  'Jackal',
  'Jaguar',
  'Javanese',
  'Jellyfish',
  'Kakapo',
  'Kangaroo',
  'King Penguin',
  'Kiwi',
  'Koala',
  'Lemming',
  'Lemur',
  'Leopard',
  'Saola',
  'Scorpion',
  'Snake',
  'Swan',
  'Tuatara',
  'Turkey',
]

io.on("connection", (socket) => {
  socket.on('create_room', () => {
    const roomService = new RoomService();
    const room = roomService.createRoom();

    socket.emit('room_created', room.id);
  });

  socket.on("disconnect", async (room) => {
    const roomService = new RoomService();

    const deleteUser = await roomService.userDisconnect(socket.room, socket.id);

    io.in(socket.room).emit('user_out', deleteUser.username);
    io.socketsLeave(room);
  });

  socket.on("join", async (room) => {
    const roomService = new RoomService();
    socket.room = room;

    io.socketsJoin(room);
    socket.emit('room_joined', room);

    const users = await roomService.getRoomUsers(room);
    const userName = animals[Math.floor(Math.random() * animals.length)];
    await roomService.addUserToRoom(room, userName, socket.id);

    socket.emit('users', users.map((user) => user.username));
    io.in(socket.room).emit('user_join', userName);
  });

  socket.on('get_word', async () => {
    const roomService = new RoomService();
    const random = Math.random() * 200;
    const word = wordsBase[Math.floor(random)];

    await roomService.setRoomWord(word, socket.room)
    io.in(socket.room).emit('word', word);
  });

  socket.on('set_letter', async (letter) => {
    const roomService = new RoomService();

    await roomService.addLetter(letter, socket.room);

    io.in(socket.room).emit('letter', letter);
  });

  socket.on('set_mistake', async (letter) => {
    const roomService = new RoomService();

    const mistakes = await roomService.addMistake(socket.room);

    if (mistakes > 5) {
      io.in(socket.room).emit('mistake');
      io.in(socket.room).emit('game_over');

      await roomService.resetGame(socket.room);

      return;
    }

    io.in(socket.room).emit('mistake', letter);
  });

  socket.on('win_game', async () => {
    const roomService = new RoomService();

    await roomService.resetGame(socket.room);

    io.in(socket.room).emit('win');
  })
});

httpServer.listen(3005, () => {
  fs.readFile('./words', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    wordsBase.push(...data.split("\n"));
  });

  console.log(`Example app listening at http://localhost:${3005}`)
});
