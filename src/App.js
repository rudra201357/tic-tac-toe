import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [message, setMessage] = useState('');
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      // Clear any pending reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // Use environment variable if set, otherwise use current host
        let wsUrl;
        if (process.env.REACT_APP_WS_URL) {
          wsUrl = process.env.REACT_APP_WS_URL;
        } else {
          // Local development: connect to localhost:5000
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            wsUrl = `${protocol}//localhost:5000`;
          } else {
            // Production: use current host (same domain)
            wsUrl = `${protocol}//${window.location.host}`;
          }
        }

        console.log('Attempting to connect to WebSocket at:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ Connected to server');
          setMessage('');
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on success
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setMessage('⚠️ Connection error. Make sure the backend server is running.');
        };

        wsRef.current.onclose = () => {
          console.log('🔌 Disconnected from server');
          
          // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
          const delayMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          
          console.log(`Reconnection attempt ${reconnectAttemptsRef.current} in ${delayMs / 1000}s`);
          setMessage(`Server disconnected. Reconnecting in ${delayMs / 1000}s...`);
          
          // Schedule reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
          }, delayMs);
        };
      } catch (error) {
        console.error('❌ Error initializing WebSocket:', error);
        setMessage('❌ Failed to initialize connection.');
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'ROOM_CREATED':
        setRoomId(data.roomId);
        setPlayerId(data.playerId);
        if (data.score) {
          setScore(data.score);
        }
        setMessage(`Room created! Share this ID: ${data.roomId}`);
        break;

      case 'GAME_START':
        if (data.roomId) {
          setRoomId(data.roomId);
        }
        if (data.playerId) {
          setPlayerId(data.playerId);
        }
        if (data.score) {
          setScore(data.score);
        }
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        setGameActive(true);
        setOpponentConnected(true);
        setMessage('Game started!');
        setWinner(null);
        setDraw(false);
        break;

      case 'BOARD_UPDATE':
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        if (data.score) {
          setScore(data.score);
        }
        if (data.winner) {
          setWinner(data.winner);
          setGameActive(false);
          setMessage(`Player ${data.winner} wins!`);
        } else if (data.draw) {
          setDraw(true);
          setGameActive(false);
          setMessage("It's a draw!");
        }
        break;

      case 'BOARD_RESET':
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        setGameActive(true);
        setWinner(null);
        setDraw(false);
        if (data.score) {
          setScore(data.score);
        }
        setMessage('Game reset!');
        break;

      case 'ERROR':
        setMessage(`Error: ${data.message}`);
        break;

      case 'OPPONENT_DISCONNECTED':
        setOpponentConnected(false);
        setGameActive(false);
        setMessage('Opponent disconnected!');
        break;

      default:
        break;
    }
  };

  const createRoom = () => {
    if (!wsRef.current) {
      setMessage('Connection not initialized. Please refresh the page.');
      return;
    }
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('Not connected to server. Please wait or refresh the page.');
      return;
    }
    
    wsRef.current.send(JSON.stringify({ type: 'CREATE_ROOM' }));
  };

  const joinRoom = () => {
    if (!joinInput.trim()) {
      setMessage('Please enter a room ID');
      return;
    }
    
    if (!wsRef.current) {
      setMessage('Connection not initialized. Please refresh the page.');
      return;
    }
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('Not connected to server. Please wait or refresh the page.');
      return;
    }
    
    wsRef.current.send(
      JSON.stringify({ type: 'JOIN_ROOM', roomId: joinInput.trim() })
    );
  };

  const makeMove = (index) => {
    if (!gameActive || board[index] !== null) return;
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('Connection lost. Please refresh the page.');
      return;
    }
    
    wsRef.current.send(
      JSON.stringify({ type: 'MAKE_MOVE', position: index })
    );
  };

  const resetGame = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessage('Connection lost. Please refresh the page.');
      return;
    }
    
    wsRef.current.send(JSON.stringify({ type: 'RESET_GAME' }));
  };

  const renderSquare = (index) => {
    return (
      <button
        className="square"
        onClick={() => makeMove(index)}
        disabled={!gameActive || board[index] !== null}
      >
        {board[index]}
      </button>
    );
  };

  return (
    <div className="App">
      <h1>Multiplayer Tic-Tac-Toe</h1>

      {!roomId ? (
        <div className="setup">
          <div className="setup-section">
            <h2>Create or Join a Game</h2>
            <button onClick={createRoom} className="btn btn-primary">
              Create New Room
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="setup-section">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={joinInput}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              onChange={(e) =>
                setJoinInput(e.target.value.replace(/\D/g, ''))
              }
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              className="input-field"
            />
            <button onClick={joinRoom} className="btn btn-primary">
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="game-container">
          <div className="game-info">
            <p>
              <strong>Room ID:</strong> <span className="room-id">{roomId}</span>
            </p>
            <p>
              <strong>Your Symbol:</strong> {playerId === 'player1' ? 'X' : 'O'}
            </p>
            <p>
              <strong>Opponent:</strong>{' '}
              {opponentConnected ? (
                <span className="status-connected">Connected</span>
              ) : (
                <span className="status-waiting">Waiting...</span>
              )}
            </p>
          </div>

          {opponentConnected ? (
            <div>
              <div className="score-section" aria-label="Score">
                <div className="score-card">
                  <span className="score-label">X</span>
                  <strong>{score.X}</strong>
                </div>
                <div className="score-card">
                  <span className="score-label">Draw</span>
                  <strong>{score.draws}</strong>
                </div>
                <div className="score-card">
                  <span className="score-label">O</span>
                  <strong>{score.O}</strong>
                </div>
              </div>

              <div className="status">
                {winner ? (
                  <p className="winner-text">
                    🎉 Player {winner} wins! 🎉
                  </p>
                ) : draw ? (
                  <p className="draw-text">It's a Draw!</p>
                ) : (
                  <p className="turn-text">
                    Current Turn: <strong>{currentPlayer}</strong>
                  </p>
                )}
              </div>

              <div className="board">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="board-row">
                    {[0, 1, 2].map((col) =>
                      renderSquare(row * 3 + col)
                    )}
                  </div>
                ))}
              </div>

              {(winner || draw) && (
                <button onClick={resetGame} className="btn btn-success">
                  Play Again
                </button>
              )}
            </div>
          ) : (
            <div className="waiting">
              <p>Waiting for opponent to join...</p>
              <p className="room-instruction">
                Share this Room ID with your opponent: <strong>{roomId}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default App;
