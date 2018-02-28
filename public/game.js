let state = {
  flagCounter: 10,
  bombs: {},
  visited: {},
  flags: {},
  rows: 10,
  columns: 10,
  isOver: false,
  difficultyScale: 1,
  isStarted: false,
}

$( document ).ready(function() {

  const bombCountColors = [ "",'blue', 'green', 'red', 'navy', 'maroon', 'teal', 'yellow', 'black'];
  let onSquare = null;

  //randomly generates bombs
  //localStorage.clear();
  const checkLocalStorage = () => {
    if(Date.now() - parseInt(localStorage.getItem('time')) < 1000 * 60 * 60 * 24){
      state = JSON.parse(localStorage.getItem('state'))
      restoreBoard();
    }
  }

  const addBanner = () => {
    $("#root").prepend(`
      <div class="restart-game-container">
        <button class="restart-game"> New Game </button>
      </div>
      <div class="game-banner">
        <div class="bombs-remaining-label">Bombs Remaining:</div>
        <div class="bombs-remaining">${state.flagCounter}</div>
      </div>
      `)
  }

  const boardFunctions = (isRestoring) => {

    state.flagCounter = Math.floor( (state.rows * state.columns) / 10) * state.difficultyScale;

    for( let i = 0; i < state.rows; i++){
      $(".gameboard").append(`<div class="row" id=${i}></div>`)
      for( let j = 0; j < state.columns; j++){
        $(`.row#${i}`).append(`<div class="square" id=${j}-${i}></div>`)
      }
    }

    addBanner();

    localStorage.setItem('state', JSON.stringify(state));
    localStorage.setItem('time', Date.now())

    $('.menu').remove();

    $(".square").hover( (e) => (onSquare = e.target.id), () => (onSquare = null) );

    $(".square").click(function(e){
      if(state.isOver) return;
      if(!state.isStarted){
        if(!isRestoring) generateBombs(e.target.id);
        console.log(state.bombs);
        state.isStarted = true;
      }
      if(state.bombs[e.target.id]){
        if($(this).children().length === 0){
          Object.keys(state.bombs).map((bomb) => {
            $(`#${bomb}`).append(`<img src="./mine.png"></img>`);
          })
          $('.win').append(`<div class="win-message"> YOU LOSE! </div>`);
          state.isOver = true;
          localStorage.clear();
        }
      } else {
        clearEmptySquares(e.target.id);
      }
      localStorage.setItem('state', JSON.stringify(state));
      localStorage.setItem('time', Date.now())
    })

    $("html").keydown( e => {
      if(state.isOver) return;
      if(e.keyCode === 32 ) {
        if($(`.square#${onSquare }`).children().length > 0 ){
          $(`.square#${onSquare} img`).remove();
          delete state.flags[onSquare];
          state.flagCounter++;
        } else if(!state.visited[onSquare] && state.flagCounter > 0){
          $(`.square#${onSquare}`).append(`<img src="./flag.png"></img>`);
          state.flags[onSquare] = true;
          state.flagCounter--;
          if(isGameOver()){
            state.isOver = true;
            localStorage.clear();
            $('.win').append(`<div class="win-message"> YOU WIN! </div>`)
          }
          $(`.bombs-remaining`).text(state.flagCounter);
        }
        localStorage.setItem('state', JSON.stringify(state));
        localStorage.setItem('time', Date.now())
      }
    })

    $('.restart-game').click(() => {
      localStorage.clear();
      window.location.reload();
    })
  }

  const restoreBoard = () => {
    boardFunctions(true);

    Object.keys(state.flags).map(id => {
      $(`.square#${id}`).append(`<img src="./flag.png"></img>`)
    })

    Object.keys(state.visited).map( id => {
      let bombs = adjacentBombs(id);
      if(bombs){
        $(`.square#${id}`).text(bombs);
        $(`.square#${id}`).css('color', bombCountColors[bombs]);
      } else if(!bombs[id]){
        $(`.square#${id}`).addClass('empty');
      }
    })
  }

  let generateBombs = (id) => {
    for( let i = 0; i < state.flagCounter; i++){
      let row = null;
      let column = null;
      while(!row || id === `${row}-${column}` || state.bombs[`${row}-${column}`]){
        row = Math.floor(Math.random() * Math.floor( state.rows ));
        column = Math.floor(Math.random() * Math.floor( state.columns ));
      }
      state.bombs[`${column}-${row}`] = true;
    }
  }

  let clearEmptySquares = (id) => {
    let coords = id.split("-").map((x) => parseInt(x));
    if(state.visited[id] || state.flags[id] || coords.length > 2 || coords[0] > state.columns - 1 || coords[0] < 0 || coords[1] > state.rows - 1 || coords[1] < 0){
      // return null;
    } else if(adjacentBombs(id) > 0){
      $(`.square#${id}`).text(adjacentBombs(id));
      $(`.square#${id}`).css('color', bombCountColors[adjacentBombs(id)]);
      state.visited[id] = true;
    } else {
      $(`.square#${id}`).addClass('empty');
      state.visited[id] = true;
      clearEmptySquares(`${coords[0] + 1}-${coords[1]}`);
      clearEmptySquares(`${coords[0] - 1}-${coords[1]}`);
      clearEmptySquares(`${coords[0]}-${coords[1] + 1}`);
      clearEmptySquares(`${coords[0]}-${coords[1] - 1}`);
      clearEmptySquares(`${coords[0] + 1}-${coords[1] + 1}`);
      clearEmptySquares(`${coords[0] - 1}-${coords[1] - 1}`);
      clearEmptySquares(`${coords[0] - 1}-${coords[1] + 1}`);
      clearEmptySquares(`${coords[0] + 1}-${coords[1] - 1}`);
    }
  }

  let adjacentBombs = (square) => {
    let coords = square.split('-').map(x => parseInt(x));
    let b = 0;

    if(state.bombs[`${coords[0] + 1}-${coords[1] + 1}`])  ++b;
    if(state.bombs[`${coords[0] + 1}-${coords[1]}`]) ++b;
    if(state.bombs[`${coords[0] + 1}-${coords[1] - 1}`]) ++b;
    if(state.bombs[`${coords[0]}-${coords[1] - 1}`])  ++b;
    if(state.bombs[`${coords[0] - 1}-${coords[1] - 1}`])  ++b;
    if(state.bombs[`${coords[0] - 1}-${coords[1]}`])  ++b;
    if(state.bombs[`${coords[0] - 1}-${coords[1] + 1}`])  ++b;
    if(state.bombs[`${coords[0]}-${coords[1] + 1}`])  ++b;
    return b;
  }

  const isGameOver = () => {
    return Object.keys(state.bombs).map(bomb => state.flags[bomb] ? true : false).reduce((allFound, next) => {
      return allFound ? next : allFound
    }, true)
  }

  checkLocalStorage();

  $(`.rows`).on('change', (e) => {
    state.rows = e.target.value;
  })

  $(`.columns`).on('change', (e) => {
    state.columns = e.target.value;
  })

  $(`.difficulty`).on('change', (e) => {
    state.difficultyScale = e.target.value;
  })

  $('.start').click(() => {
    boardFunctions();
  })

})
