const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Game rooms storage
const rooms = new Map();

// Generate unique room ID
function generateRoomId() {
  let roomId;
  do {
    roomId = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(roomId));
  return roomId;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  let userRoom = null;
  let playerId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'CREATE_ROOM':
          userRoom = generateRoomId();
          playerId = 'player1';
          rooms.set(userRoom, {
            roomId: userRoom,
            player1: ws,
            player2: null,
            board: Array(9).fill(null),
            currentPlayer: 'X',
            gameActive: false,
            moves: 0,
            score: {
              X: 0,
              O: 0,
              draws: 0,
            },
          });
          ws.send(
            JSON.stringify({
              type: 'ROOM_CREATED',
              roomId: userRoom,
              playerId,
              score: rooms.get(userRoom).score,
            })
          );
          break;

        case 'JOIN_ROOM':
          const room = rooms.get(message.roomId);
          if (!room) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'Room not found',
              })
            );
            break;
          }
          if (room.player2) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'Room is full',
              })
            );
            break;
          }
          userRoom = message.roomId;
          playerId = 'player2';
          room.player2 = ws;
          room.gameActive = true;

          // Send room state to both players with each player's own identity.
          const roomState = {
            type: 'GAME_START',
            board: room.board,
            currentPlayer: room.currentPlayer,
            roomId: userRoom,
            score: room.score,
          };
          room.player1.send(
            JSON.stringify({ ...roomState, playerId: 'player1' })
          );
          room.player2.send(
            JSON.stringify({ ...roomState, playerId: 'player2' })
          );
          break;

        case 'MAKE_MOVE':
          const gameRoom = rooms.get(userRoom);
          if (!gameRoom || !gameRoom.gameActive) {
            break;
          }

          const { position } = message;
          const expectedPlayer = gameRoom.currentPlayer === 'X' ? 'player1' : 'player2';

          if (playerId !== expectedPlayer) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'Not your turn',
              })
            );
            break;
          }

          if (gameRoom.board[position] !== null) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: 'Position already taken',
              })
            );
            break;
          }

          gameRoom.board[position] = gameRoom.currentPlayer;
          gameRoom.moves++;

          // Check for winner
          const winner = checkWinner(gameRoom.board);
          const isBoardFull = gameRoom.moves === 9;

          const updateMessage = {
            type: 'BOARD_UPDATE',
            board: gameRoom.board,
            currentPlayer: gameRoom.currentPlayer === 'X' ? 'O' : 'X',
            winner,
            gameOver: winner || isBoardFull,
          };

          if (winner) {
            updateMessage.winner = winner;
            gameRoom.gameActive = false;
            gameRoom.score[winner]++;
          } else if (isBoardFull) {
            updateMessage.draw = true;
            gameRoom.gameActive = false;
            gameRoom.score.draws++;
          }

          updateMessage.score = gameRoom.score;

          gameRoom.currentPlayer = gameRoom.currentPlayer === 'X' ? 'O' : 'X';

          // Send to both players
          if (gameRoom.player1 && gameRoom.player1.readyState === WebSocket.OPEN) {
            gameRoom.player1.send(JSON.stringify(updateMessage));
          }
          if (gameRoom.player2 && gameRoom.player2.readyState === WebSocket.OPEN) {
            gameRoom.player2.send(JSON.stringify(updateMessage));
          }
          break;

        case 'RESET_GAME':
          const resetRoom = rooms.get(userRoom);
          if (resetRoom) {
            resetRoom.board = Array(9).fill(null);
            resetRoom.currentPlayer = 'X';
            resetRoom.moves = 0;
            resetRoom.gameActive = true;

            const resetMessage = {
              type: 'BOARD_RESET',
              board: resetRoom.board,
              currentPlayer: 'X',
              score: resetRoom.score,
            };

            if (resetRoom.player1 && resetRoom.player1.readyState === WebSocket.OPEN) {
              resetRoom.player1.send(JSON.stringify(resetMessage));
            }
            if (resetRoom.player2 && resetRoom.player2.readyState === WebSocket.OPEN) {
              resetRoom.player2.send(JSON.stringify(resetMessage));
            }
          }
          break;
      }
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    if (userRoom && rooms.has(userRoom)) {
      const room = rooms.get(userRoom);
      if (room.player1 === ws || room.player2 === ws) {
        const otherPlayer = room.player1 === ws ? room.player2 : room.player1;
        if (otherPlayer && otherPlayer.readyState === WebSocket.OPEN) {
          otherPlayer.send(
            JSON.stringify({
              type: 'OPPONENT_DISCONNECTED',
            })
          );
        }
        rooms.delete(userRoom);
      }
    }
  });
});

function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Fallback to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}`);
});
