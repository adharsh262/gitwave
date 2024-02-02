const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()

app.use(express.json())
let db = null

const intailazationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Starting the Server...')
    })
  } catch (e) {
    console.log(`Database Error : ${e.message}`)
    process.exit(1)
  }
}

intailazationDbAndServer()

// list of players using get api

const playerDetailsToCamelCase = listObj => {
  return {
    playerId: listObj.player_id,
    playerName: listObj.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersList = `
    
    SELECT 
        *
    FROM
        player_details;    
    
    `

  const playerList = await db.all(getPlayersList)
  response.send(playerList.map(eachObj => playerDetailsToCamelCase(eachObj)))
})

// get each player using get api

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const getQueryOfEachPlayer = `
  
  SELECT
    *
  FROM
    player_details
  WHERE
    player_id=${playerId}  ;
  
  `

  const player = await db.get(getQueryOfEachPlayer)
  response.send(playerDetailsToCamelCase(player))
})

//update the playerDetails using put

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const {player_name} = request.body

  const updatePlayerDetailsQuery = `
    
    UPDATE
      player_details
    SET
      player_name='${player_name}'  
    WHERE
      player_id=${playerId}  ;

    
    
    `

  await db.run(updatePlayerDetailsQuery)
  response.send('Player Details Updated')
})

//match details using get api

const convertMatchDetailsIntoCamelCase = matchObj => {
  return {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  }
}
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
  
  SELECT
    *
  FROM
    match_details
  WHERE
    match_id=${matchId}    ;
  
  `

  const matchDetails = await db.get(getMatchDetailsQuery)
  response.send(convertMatchDetailsIntoCamelCase(matchDetails))
})

//get all matches list of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const getAllMAtchDEtailaQuery = `
    
    SELECT
      match_details.match_id AS matchId,match_details.match AS match,match_details.year AS year
    FROM
      player_match_score
    INNER JOIN 
      match_details 
    ON 
      player_match_score.match_id=match_details.match_id 
    WHERE
      player_match_score.player_id=${playerId};

    
    
    `

  const allMatchByPlayer = await db.all(getAllMAtchDEtailaQuery)
  response.send(allMatchByPlayer)
})

// list of players of specific match

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params

  const getplayersOFMatchQuery = `
    
    SELECT 
     player_details.player_id AS playerId,player_details.player_name AS playerName
    FROM
      player_details
    INNER JOIN
      player_match_score 
    ON
      player_match_score.player_id=player_details.player_id
    WHERE
      player_match_score.match_id=${matchId};
    
    `
  const getPlayerDetail = await db.all(getplayersOFMatchQuery)
  response.send(getPlayerDetail)
})

//get stats using get api

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params

  const getStats = `
    
    SELECT
      player_details.player_id AS playerId,player_details.player_name AS playerName,sum(player_match_score.score) AS totalScore,sum(player_match_score.fours) AS totalFours,sum(player_match_score.sixes) AS totalSixes
    FROM
      player_match_score
    INNER JOIN
      player_details
    ON
      player_details.player_id=player_match_score.player_id
    WHERE
      player_match_score.player_id=${playerId}   
    GROUP BY
      player_match_score.player_id  ; 
    
    `

  const stats = await db.all(getStats)
  response.send(stats)
})

module.exports=app;
