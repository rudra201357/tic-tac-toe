# Quick Start Guide

## Installation

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Install server dependencies:**
   ```bash
   npm install express ws
   ```

## Starting the Game (Development)

### Method 1: Run servers in separate terminals (Recommended)

**Terminal 1 - React Development Server:**
```bash
npm start
```
The React app will open at `http://localhost:3000`

**Terminal 2 - WebSocket Server:**
```bash
npm run server
```

### Method 2: Run both simultaneously (requires `concurrently`)

First install:
```bash
npm install --save-dev concurrently
```

Then run:
```bash
npm run dev
```

## How to Use the Game

1. **Player 1 - Create a game:**
   - Click "Create New Room"
   - Copy the Room ID shown

2. **Player 2 - Join the game:**
   - Enter the Room ID from Player 1
   - Click "Join Room"

3. **Play:**
   - Player 1 is X, Player 2 is O
   - Click squares to make moves
   - Game updates in real-time

## Quick Tips

- You can play on two different computers or two different browser windows on the same computer
- Room IDs are valid while both players remain connected
- Click "Play Again" to reset and play another round with the same opponent

## Troubleshooting

**"React app won't load"**
- Make sure `npm start` is running in a terminal
- Check that port 3000 is not in use

**"Connection error in the game"**
- Make sure `npm run server` is running in another terminal
- Check that port 5000 is not in use

**"Room not found"**
- Double-check the Room ID (should be 7 characters)
- Recreate the room if it expired

## Next Steps

- Read `README.md` for complete documentation
- Deploy to Heroku or other platforms for online multiplayer

Enjoy the game!
