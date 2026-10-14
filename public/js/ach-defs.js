/* Game-specific achievements (cosmetic coin rewards). Shared ones live in achievements.js. */
window.ACH_DEFS = [
  { "id": "sj_first", "name": "First Escape", "desc": "Clear your first jam", "metric": "wins", "goal": 1, "reward": 15 },
  { "id": "sj_wins25", "name": "Traffic Warden", "desc": "Clear 25 jams (replays count)", "metric": "wins", "goal": 25, "reward": 80 },
  { "id": "sj_wins100", "name": "Gridlock Buster", "desc": "Clear 100 jams", "metric": "wins", "goal": 100, "reward": 200 },
  { "id": "sj_par10", "name": "Shortest Route", "desc": "Clear 10 jams in the fewest possible moves", "metric": "stars3", "goal": 10, "reward": 100 },
  { "id": "sj_clean10", "name": "No Rewind", "desc": "Clear 10 jams without Undo or Hint", "metric": "clean_wins", "goal": 10, "reward": 70 },
  { "id": "sj_moves500", "name": "Road Trip", "desc": "Make 500 moves", "metric": "moves", "goal": 500, "reward": 60 },
  { "id": "sj_lvl10", "name": "Lane Changer", "desc": "Reach level 10", "metric": "best_level", "goal": 10, "reward": 60 },
  { "id": "sj_all", "name": "Open Roads", "desc": "Clear the final level", "metric": "best_level", "goal": 20, "reward": 250 }
];
