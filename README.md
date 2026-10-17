# Coin Rush - Collect The Coins (HNG15 Personal Task, Start.ng ready)

Three.js game: walk around, collect 5 coins, dodge 3 enemies + 3 walls. 3 lives.

## Start.ng compliance
- Player via `startng:whoami` (connect iframe, origin-checked), fallback to local test login
- Character built from `style`: primaryColor=shirt, secondaryColor=pants, skinColor, hairColor, hair, hat, accessory
- Profile card with face + name + @account + Sign in
- Leaderboard `startng.json`: coins (highest), deaths (lowest). Saves on win/lose
- `cover.png` 1600x1000 next to index.html
- All paths relative (`./`), three.js vendored (`three.module.js`), no external CDN

## Run locally
```bash
cd /Users/mac/Documents/lesson8-task
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish (from PDF guide)
1. Create PUBLIC GitHub repo, push all files (index.html, cover.png, game.js, startng.js, style.css, three.module.js, startng.json)
2. Check:
```bash
curl -X POST https://api.start.ng/games/check -H "Content-Type: application/json" -d '{"repo_url":"https://github.com/YOUR-USERNAME/YOUR-REPO","name":"coin-rush"}'
```
Fix errors, re-push, re-check.
3. Publish:
```bash
curl -X POST https://api.start.ng/games/publish -H "Content-Type: application/json" -d '{"repo_url":"https://github.com/YOUR-USERNAME/YOUR-REPO","name":"coin-rush"}'
```
Copy `approve_url` from reply, open in browser, sign in, approve.
4. Live at `https://coin-rush.start.ng`. Test: loads, moves, restarts, character shows when signed in, guest look when not.
5. Submit repo link + live link.
Later updates: just push, auto-updates in 1-2 min.

## Controls
WASD / Arrows move, R restart.
