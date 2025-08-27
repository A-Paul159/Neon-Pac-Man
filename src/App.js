// App.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const CELL_SIZE = 40;
const MAZE_WIDTH = 20;
const MAZE_HEIGHT = 20;
const SPEED = 150;
const POWER_PELLET_DURATION = 7000;
const SPEED_BOOST_DURATION = 5000;


const mazeLayout = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,0,0,0,0,0,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,1,1,0,0,1,1,0,1,0,0,0,0,1],
  [1,1,1,1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,1,1],
  [0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
  [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],// row 10
  [1,0,1,1,0,1,1,0,0,0,0,0,0,1,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,0,1,1,1,1,0,0,0,0,1,0,0,1],
  [1,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,1,1,0,0,1,1,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,1,0,0,1,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const App = () => {
  const powerPelletTimeoutRef = useRef(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  useEffect(() => {
    setShowWelcomeModal(true);
  }, []);


  const [gameState, setGameState] = useState({
    pacman: { x: 1, y: 1, direction: null },
    ghosts: [
      { x: 9, y: 9, color: '#FF0000', scared: false },
      { x: 10, y: 9, color: '#00FFFF', scared: false },
      { x: 9, y: 10, color: '#FF69B4', scared: false },
      { x: 10, y: 10, color: '#FFA500', scared: false }
    ],
    dots: [],
    powerPellets: [],
    speedBoosts: [],
    extraLives: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    levelComplete: false,
    powerPelletActive: false,
    speedBoostActive: false,
    showLevelComplete: false
  });
  const generateLevelItems = () => {
    const newDots = [];
    const newPowerPellets = [];
    const newSpeedBoosts = [];
    const newExtraLives = [];
  
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (mazeLayout[y][x] === 0) {
          if ((x === 1 || x === 18) && (y === 1 || y === 18)) {
            newPowerPellets.push({ x, y });
          } else if (Math.random() < 0.05) {
            newSpeedBoosts.push({ x, y });
          } else if (Math.random() < 0.02) {
            newExtraLives.push({ x, y });
          } else {
            newDots.push({ x, y });
          }
        }
      }
    }

    const bottomLeft = { x: 1, y: MAZE_HEIGHT - 2 };
    const bottomRight = { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 };
  
    [newPowerPellets, newDots].forEach(arr => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (
          (arr[i].x === bottomLeft.x && arr[i].y === bottomLeft.y) ||
          (arr[i].x === bottomRight.x && arr[i].y === bottomRight.y)
        ) {
          arr.splice(i, 1);
        }
      }
    });
  
    newPowerPellets.push(bottomLeft, bottomRight);
  
    return { newDots, newPowerPellets, newSpeedBoosts, newExtraLives };
  };
  

  useEffect(() => {
    const { newDots, newPowerPellets, newSpeedBoosts, newExtraLives } = generateLevelItems();
    setGameState(prev => ({
      ...prev,
      dots: newDots,
      powerPellets: newPowerPellets,
      speedBoosts: newSpeedBoosts,
      extraLives: newExtraLives
    }));
  }, [gameState.level]);
  

  const movePacman = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver) return prev;
      

      const { pacman } = prev;
      let newX = pacman.x;
      let newY = pacman.y;

      switch (pacman.direction) {
        case 'UP': newY--; break;
        case 'DOWN': newY++; break;
        case 'LEFT': newX--; break;
        case 'RIGHT': newX++; break;
      }

      if (newY === 8) {
        if (newX < 0) newX = MAZE_WIDTH - 1;
        else if (newX >= MAZE_WIDTH) newX = 0;
      }
      

      if (newX < 0 || newX >= MAZE_WIDTH || newY < 0 || newY >= MAZE_HEIGHT || 
          mazeLayout[newY][newX] === 1) {
        return prev;
      }

      let newDots = [...prev.dots];
      let newPowerPellets = [...prev.powerPellets];
      let newSpeedBoosts = [...prev.speedBoosts];
      let newExtraLives = [...prev.extraLives];
      let newScore = prev.score;
      let newLives = prev.lives;
      let powerPelletActive = prev.powerPelletActive;
      let speedBoostActive = prev.speedBoostActive;

      const dotIndex = newDots.findIndex(d => d.x === newX && d.y === newY);
      if (dotIndex !== -1) {
        newDots.splice(dotIndex, 1);
        newScore += 10;
      }

      const powerPelletIndex = newPowerPellets.findIndex(p => p.x === newX && p.y === newY);
      if (powerPelletIndex !== -1) {
        newPowerPellets.splice(powerPelletIndex, 1);
        newScore += 50;
        powerPelletActive = true;
        if (powerPelletTimeoutRef.current) {
          clearTimeout(powerPelletTimeoutRef.current);
        }
        powerPelletTimeoutRef.current = setTimeout(() => {
          setGameState(p => ({ ...p, powerPelletActive: false }));
          powerPelletTimeoutRef.current = null;
        }, POWER_PELLET_DURATION);
      }

      const speedBoostIndex = newSpeedBoosts.findIndex(s => s.x === newX && s.y === newY);
      if (speedBoostIndex !== -1) {
        newSpeedBoosts.splice(speedBoostIndex, 1);
        newScore += 30;
        speedBoostActive = true;
        setTimeout(() => setGameState(p => ({ ...p, speedBoostActive: false })), SPEED_BOOST_DURATION);
      }

      const extraLifeIndex = newExtraLives.findIndex(e => e.x === newX && e.y === newY);
      if (extraLifeIndex !== -1) {
        newExtraLives.splice(extraLifeIndex, 1);
        newScore += 100;
        newLives++;
      }

      if (newDots.length === 0) {
        return {
          ...prev,
          dots: [],
          powerPellets: newPowerPellets,
          speedBoosts: newSpeedBoosts,
          extraLives: newExtraLives,
          score: newScore,
          lives: newLives,
          ghosts: prev.ghosts,
          powerPelletActive,
          speedBoostActive,
          levelComplete: true
        };
      }
      

      let newGhosts = prev.ghosts.map(g => ({
        ...g,
        scared: powerPelletActive
      }));

      const ghostCollision = newGhosts.find(g => g.x === newX && g.y === newY);
      if (ghostCollision) {
        if (powerPelletActive) {
          newScore += 200;
          ghostCollision.x = 9;
          ghostCollision.y = 9;
        } else {
          newLives--;
          if (newLives <= 0) {
            return {
              ...prev,
              lives: 0,
              gameOver: true
            };
          }
      
          return {
            ...prev,
            pacman: { x: 1, y: 1, direction: 'RIGHT' },
            ghosts: prev.ghosts.map(g => ({ ...g, x: 9, y: 9 })),
            lives: newLives
          };
        }
      }
      
      const allPelletsGone =
        newDots.length === 0 &&
        newPowerPellets.length === 0 &&
        newSpeedBoosts.length === 0 &&
        newExtraLives.length === 0;

      if (!prev.gameOver && newLives > 0 && allPelletsGone) {
        return {
          ...prev,
          dots: [],
          powerPellets: [],
          speedBoosts: [],
          extraLives: [],
          ghosts: prev.ghosts.map(g => ({ ...g, x: 9, y: 9 })),
          pacman: { ...pacman, x: 1, y: 1 },
          showLevelComplete: true
        };
      }

      return {
        ...prev,
        pacman: { ...pacman, x: newX, y: newY },
        dots: newDots,
        powerPellets: newPowerPellets,
        speedBoosts: newSpeedBoosts,
        extraLives: newExtraLives,
        score: newScore,
        lives: newLives,
        ghosts: newGhosts,
        powerPelletActive,
        speedBoostActive
      };
    });
  }, []);

  const advanceToNextLevel = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      pacman: { x: 1, y: 1, direction: 'RIGHT' },
      ghosts: prev.ghosts.map(g => ({ ...g, x: 9, y: 9 })),
      showLevelComplete: false
    }));
  };
  const restartGame = () => {
    setGameState(prev => ({
      ...prev,
      pacman: { x: 1, y: 1, direction: 'RIGHT' },
      ghosts: [
        { x: 9, y: 9, color: '#FF0000', scared: false },
        { x: 10, y: 9, color: '#00FFFF', scared: false },
        { x: 9, y: 10, color: '#FF69B4', scared: false },
        { x: 10, y: 10, color: '#FFA500', scared: false }
      ],
      dots: [],
      powerPellets: [],
      speedBoosts: [],
      extraLives: [],
      score: 0,
      lives: 3,
      gameOver: false,
      powerPelletActive: false,
      speedBoostActive: false,
      collision: false,
      paused: false,
      level: 1
    }));
  };
  
  

  const checkGhostCollisions = useCallback(() => {
    setGameState(prev => {
      const { pacman, ghosts, powerPelletActive, score, lives } = prev;
      let newScore = score;
      let newLives = lives;
  
      const collidedGhost = ghosts.find(g => g.x === pacman.x && g.y === pacman.y);
  
      if (!collidedGhost) return prev;
  
      if (powerPelletActive) {
        newScore += 200;
        const resetGhosts = ghosts.map(g =>
          g.x === pacman.x && g.y === pacman.y ? { ...g, x: 9, y: 9 } : g
        );
        return {
          ...prev,
          ghosts: resetGhosts,
          score: newScore
        };
      } else {
        newLives--;
        if (newLives <= 0) {
          return { ...prev, lives: 0, gameOver: true };
        }
        return {
          ...prev,
          lives: newLives,
          pacman: { ...pacman, x: 1, y: 1 },
          ghosts: ghosts.map(g => ({ ...g, x: 9, y: 9 }))
        };
      }
    });
  }, []);
  

  const moveGhosts = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver) return prev;
  
      const newGhosts = prev.ghosts.map(ghost => {
        const directions = [
          { x: 0, y: -1 }, // UP
          { x: 0, y: 1 },  // DOWN
          { x: -1, y: 0 }, // LEFT
          { x: 1, y: 0 }   // RIGHT
        ];
  
        const validMoves = directions
          .map(dir => {
            let newX = ghost.x + dir.x;
            let newY = ghost.y + dir.y;
  
            if (newY === 8) {
              if (newX < 0) newX = MAZE_WIDTH - 1;
              else if (newX >= MAZE_WIDTH) newX = 0;
            }
            
  
            return { x: newX, y: newY };
          })
          .filter(pos =>
            pos.y >= 0 &&
            pos.y < MAZE_HEIGHT &&
            mazeLayout[pos.y][pos.x] !== 1
          );
  
        if (validMoves.length === 0) return ghost;
  
        const nextMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        return { ...ghost, x: nextMove.x, y: nextMove.y };
      });
  
      return { ...prev, ghosts: newGhosts };
    });
  }, []);
  
  

  useEffect(() => {
    const gameLoop = setInterval(() => {
      movePacman();
      setTimeout(checkGhostCollisions, 10); 
    }, gameState.speedBoostActive ? SPEED / 2 : SPEED);
    return () => clearInterval(gameLoop);
  }, [movePacman, moveGhosts, checkGhostCollisions, gameState.speedBoostActive]);

  useEffect(() => {
    const ghostLoop = setInterval(() => {
      moveGhosts();
    }, 500); //GHOST SPEED
  
    return () => clearInterval(ghostLoop);
  }, [moveGhosts]);
    

  useEffect(() => {
    const handleKeyPress = (e) => {
      e.preventDefault();
      const directions = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT'
      };
      if (directions[e.key]) {
        setGameState(prev => ({
          ...prev,
          pacman: { ...prev.pacman, direction: directions[e.key] }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const renderMaze = useMemo(() => {
    const maze = [];
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const isWall = mazeLayout[y][x] === 1;
        const isPacman = gameState.pacman.x === x && gameState.pacman.y === y;
        const isGhost = gameState.ghosts.some(g => g.x === x && g.y === y);
        const isDot = gameState.dots.some(d => d.x === x && d.y === y);
        const isPowerPellet = gameState.powerPellets.some(p => p.x === x && p.y === y);
        const isSpeedBoost = gameState.speedBoosts.some(s => s.x === x && s.y === y);
        const isExtraLife = gameState.extraLives.some(e => e.x === x && e.y === y);


        maze.push(
          <div
            key={`${x}-${y}`}
            className={`cell ${isWall ? 'wall' : ''}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
            }}
          >
            {isDot && <div className="dot" />}
            {isPowerPellet && <div className="power-pellet" />}
            {isSpeedBoost && <div className="speed-boost" />}
            {isExtraLife && <div className="extra-life" />}
            {isPacman && (
              <div
                className="pacman"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: {
                    UP: 'rotate(270deg)',
                    DOWN: 'rotate(90deg)',
                    LEFT: 'rotate(180deg)',
                    RIGHT: 'rotate(0deg)'
                  }[gameState.pacman.direction]
                }}
              />
            )}
            {isGhost && (
              <div
                className="ghost"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: gameState.powerPelletActive ? '#fff' : gameState.ghosts.find(g => g.x === x && g.y === y).color,
                  opacity: 1
                }}
              />
            )}
          </div>
        );                
      }
    }
    return maze;
  }, [gameState]);

  return (
    

    <div className="container-fluid bg-dark text-light min-vh-100 d-flex flex-column align-items-center justify-content-center">
      <div className="row w-100 mb-4">
        <div className="col-12 text-center">
        <h1 className="pacman-title text-center">Neon Pac-Man</h1>
          <div className="d-flex justify-content-center gap-4 mt-3">
            <div className="fs-4">Score: {gameState.score}</div>
            <div className="fs-4">Lives: {gameState.lives}</div>
            <div className="fs-4">Level: {gameState.level}</div>
          </div>
        </div>
      </div>

      {showWelcomeModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content custom-modal">
              <div className="modal-header border-0">
                <h5 className="modal-title w-100 text-center neon-title">
                  Welcome to Neon Pac-Man
                </h5>
              </div>
              <div className="modal-body text-center">
                <p className="lead text-light">
                  Collect power pellets 🟣 and speed boosts 🟡 to help clear the level. Be on the look out for extra lives 🔴 Can you clear all levels?
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button className="btn btn-neon" onClick={() => setShowWelcomeModal(false)}>
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {gameState.showLevelComplete && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content custom-modal">
              <div className="modal-header border-0">
                <h5 className="modal-title w-100 text-center neon-title">
                  Level {gameState.level} Complete!
                </h5>
              </div>
              <div className="modal-body text-center">
                <p className="lead text-light">
                  Great job! Get ready for Level {gameState.level + 1}.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button className="btn btn-neon" onClick={advanceToNextLevel}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {gameState.gameOver ? (
        <div className="alert alert-danger text-center">
          <h2>Game Over!</h2>
          <p>Final Score: {gameState.score}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Restart
          </button>
        </div>
      ) : gameState.levelComplete ? (
        <div className="alert alert-success text-center">
          <h2>Level {gameState.level} Complete!</h2>
          <p>Score: {gameState.score}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              const { newDots, newPowerPellets, newSpeedBoosts, newExtraLives } = generateLevelItems();
              setGameState(prev => ({
                ...prev,
                level: prev.level + 1,
                pacman: { x: 1, y: 1, direction: 'RIGHT' },
                ghosts: prev.ghosts.map(g => ({ ...g, x: 9, y: 9 })),
                dots: newDots,
                powerPellets: newPowerPellets,
                speedBoosts: newSpeedBoosts,
                extraLives: newExtraLives,
                levelComplete: false
              }));
            }}
          >
            Start Level {gameState.level + 1}
          </button>
        </div>
      
      ) : (
        <div
          className="maze-container position-relative rounded"
          style={{
            width: MAZE_WIDTH * CELL_SIZE,
            height: MAZE_HEIGHT * CELL_SIZE
          }}
        >
          {renderMaze}
        </div>
      )}


      
    </div>
  );
};

export default App;