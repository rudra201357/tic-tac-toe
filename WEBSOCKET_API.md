# WebSocket API Reference

## Message Format

All messages are sent as JSON strings via WebSocket.

## Client → Server Messages

### CREATE_ROOM
Creates a new game room.

```json
{
  "type": "CREATE_ROOM"
}
```

**Response:** ROOM_CREATED message with roomId and playerId

---

### JOIN_ROOM
Joins an existing room to play with another player.

```json
{
  "type": "JOIN_ROOM",
  "roomId": "abc1234"
}
```

**Response:** GAME_START message or ERROR

---

### MAKE_MOVE
Places a mark (X or O) on the board at the specified position.

```json
{
  "type": "MAKE_MOVE",
  "position": 0
}
```

Board positions are numbered 0-8:
```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

**Response:** BOARD_UPDATE message

---

### RESET_GAME
Resets the board for a new game (both players must be connected).

```json
{
  "type": "RESET_GAME"
}
```

**Response:** BOARD_RESET message to both players

---

## Server → Client Messages

### ROOM_CREATED
Sent when a room is successfully created.

```json
{
  "type": "ROOM_CREATED",
  "roomId": "abc1234",
  "playerId": "player1"
}
```

---

### GAME_START
Sent to both players when they're both ready to play.

```json
{
  "type": "GAME_START",
  "board": [null, null, null, null, null, null, null, null, null],
  "currentPlayer": "X",
  "roomId": "abc1234"
}
```

---

### BOARD_UPDATE
Sent to both players when a move is made.

```json
{
  "type": "BOARD_UPDATE",
  "board": ["X", null, "O", null, "X", null, null, "O", null],
  "currentPlayer": "O",
  "winner": null,
  "gameOver": false
}
```

When there's a winner:
```json
{
  "type": "BOARD_UPDATE",
  "board": ["X", "X", "X", "O", "O", null, null, null, null],
  "currentPlayer": "O",
  "winner": "X",
  "gameOver": true
}
```

When it's a draw:
```json
{
  "type": "BOARD_UPDATE",
  "board": ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
  "currentPlayer": "X",
  "draw": true,
  "gameOver": true
}
```

---

### BOARD_RESET
Sent to both players when the board is reset.

```json
{
  "type": "BOARD_RESET",
  "board": [null, null, null, null, null, null, null, null, null],
  "currentPlayer": "X"
}
```

---

### ERROR
Sent when an error occurs.

```json
{
  "type": "ERROR",
  "message": "Room not found"
}
```

Common error messages:
- "Room not found"
- "Room is full"
- "Not your turn"
- "Position already taken"

---

### OPPONENT_DISCONNECTED
Sent when the opponent disconnects from the game.

```json
{
  "type": "OPPONENT_DISCONNECTED"
}
```

---

## Game Rules

- Board positions: 0-8 (numbered left to right, top to bottom)
- Player symbols: X and O
- Player 1 (creator) is always X
- Player 2 (joiner) is always O
- X always goes first
- Win condition: 3 in a row (horizontal, vertical, or diagonal)
- Draw: All 9 squares filled with no winner

## Connection Flow

1. Client connects via WebSocket
2. Client sends CREATE_ROOM → receives ROOM_CREATED
3. Second client connects and sends JOIN_ROOM → both receive GAME_START
4. Players alternate sending MAKE_MOVE → both receive BOARD_UPDATE
5. Game ends when BOARD_UPDATE has gameOver: true
6. Players can send RESET_GAME to play again
7. If a player disconnects, other receives OPPONENT_DISCONNECTED
