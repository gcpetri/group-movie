var socket = io();

var userid = "";
var username = "";
var roomcode = "";
var roomid = "";
var isleader = false;
var services_names = ['HBO', 'DisneyPlus', 'Netflix', 'Hulu', 'PrimeVideo', 'YT'];
var in_group_page = true;
var pageLoaded = false;
var ifFirst = true;

// tournament variables
var num_people_in_room = 0;
var num_votes = 0;
var num_yes = 0;
var num_prev_yes = 0;
var tourn_on_movie = 0;
var tourn_movie_list = [];
var tourn_movie_list_sample = ['Die Hard', 'Last Summer', 'Coco', 'Kung Fu Panda 2', 'Chicken Little', 'Mulan', 'The Avengers', 'The Emperor\'s New Groove'];
var tourn_movie_list_semis = [];
var tourn_movie_list_finals = [];
var final_rankings = [];

var curr_services = "000000";

var TOTAL_TIME = 360; // how long the voting period is (seconds)

// YOUTUBE API
function searchbar(tourn_movie_name){
    //youtube api
    //recommendation will later changed by the api recommendations not user input
    document.getElementById("tourn_movie_name").innerHTML = tourn_movie_name;
    var YTapi = 'https://youtube.googleapis.com/youtube/v3/search?q=';
    var YTkey = '&videoEmbeddable=videoEmbeddableUnspecified&key=AIzaSyAMmDNe9lgTksEqktJVZsHn7cOCahiaJ8U';
    var YTcall = YTapi + tourn_movie_name + ' trailer' + YTkey;
    var videoID;
    // COMMENT HERE FOR TESTING

    fetch(YTcall).then(response => {
        return response.json();
        }).then(data => {
            //console.log(data);
            var i = 0;
            while(data.items[i].kind != "youtube#searchResult"){
                i++;
            }
            videoID = data.items[i].id.videoId;
            document.getElementById("youtube-embed").src = "https://www.youtube.com/embed/" + videoID + "?&autoplay=1";
        }).catch(err => {
            console.error("Execute error", err);
    });
    
      //calls dog api to get the description
      //dog_api();
};

// IMDB API
//API keys: k_3g585gzi k_nswm7dmm
//const url = 'https://imdb-api.com/en/API/Top250Movies/k_nswm7dmm';
// Greg's API Key = "9f9c87598emsh6e2f1423356298cp1e38a5jsn4734221734ef"
// Cassidy's API Key = "dcbe7461f3mshda10858f3de413dp136514jsn33f0895ea180"

let movies = [];
let count = 0;

async function addTitle(first) {
  const movieTitle = await getMovieName();
  movies.push(movieTitle);
  if(first) {
    const divName = document.getElementById('movieName');
    let spanName = createNode('span');
    spanName.innerHTML = movieTitle;
    append(divName, spanName);
  }
  else {
    document.getElementById('movieName').innerHTML = movieTitle;
  }
  getMovieID(movieTitle, first);

}

function getMovieID(movieTitle, first) {
  var link = "https://imdb8.p.rapidapi.com/auto-complete?q=" + movieTitle;
  var url = encodeURI(link);
  fetch(url, {
    "method": "GET",
    "headers": {
      "x-rapidapi-key": "9f9c87598emsh6e2f1423356298cp1e38a5jsn4734221734ef",
      "x-rapidapi-host": "imdb8.p.rapidapi.com"
    }
  })

  .then((resp) => resp.json())
  .then(function(data) {
    let movie_id = data.d[0].id
    getMovieInfo(movie_id,first);

    })
  .catch(function(error) {
    console.log(error);
  });
}

function getMovieInfo(id, first) {

  url = 'https://imdb8.p.rapidapi.com/title/get-overview-details?tconst=' + id + '&currentCountry=US';

  return fetch(url, {
  	"method": "GET",
  	"headers": {
  		"x-rapidapi-key": "9f9c87598emsh6e2f1423356298cp1e38a5jsn4734221734ef",
  		"x-rapidapi-host": "imdb8.p.rapidapi.com"
  	}
  })
    .then(res => {
      return res.json();
    })
    .then(data => {
      addImage(data.title.image.url, first);
      addRating(data.ratings.rating, first);
      addPlot(data.plotOutline.text, first);
    })
    .catch(function(error) {
      console.log(error);
    })
}
function addImage(url, first) {
  if(first) {
    const divImage = document.getElementById('movieImage');
    let img = createNode('img');
    img.src = url;
    img.setAttribute("id","image");
    img.width = 450;
    img.height = 600;
    append(divImage, img);
  }
  else {
    document.getElementById('image').src = url;
  }
}
function addRating(rating, first) {
  if(first) {
    const divRating = document.getElementById('movieRating');
    let spanRating = createNode('span');
    spanRating.innerHTML = "Rating: " + rating;
    append(divRating, spanRating);
  }
  else {
    document.getElementById('movieRating').innerHTML = "Rating: " + rating;
  }
}
function addPlot(plot, first) {
  if(first) {
    const divDescription = document.getElementById('movieDescription');
    let spanDescription = createNode('span');
    spanDescription.innerHTML = plot;
    append(divDescription, spanDescription);
  }
  else {
    document.getElementById('movieDescription').innerHTML = plot;
  }

}
function createNode(element) {
    return document.createElement(element);
}
function append(parent, el) {
  return parent.appendChild(el);
}
// end API stuff

async function five_second_timer() {
    document.getElementById('overlay').hidden = false;
    var tourn_timer = document.getElementById('timer-tournament');
    var sec = 3;
    document.getElementById("youtube-embed").src = "";
    var timer = setInterval(async function(){
        tourn_timer.innerHTML = 'voting in ' + sec.toString();
        sec--;
        //console.log(sec);
        if (sec < 0)
        {
            document.getElementById('overlay').hidden = true;
            document.getElementById('tourn-body').hidden = false;
            document.getElementById('tourn-page').hidden = true;
            clearInterval(timer);
        }
    }, 1000);
}

async function refreshResults() {
    //console.log('refresh results', JSON.stringify(final_rankings));
    const data = {
        roomcode
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data),
        body: JSON.stringify(final_rankings),
    }
    const route = '/refresh-results/'+roomcode;
    let res = await fetch(route, options);
    const json = await res.json();
    //console.log(json);
    let img_numbers = [];
    for (var i = 0; i < json.length; i++) {
        if (i % 2 != 0) { img_numbers.push(json[i]); }
    }

    document.getElementById('result-winner').innerHTML = final_rankings[0] + ' Wins!';
    var rt = document.getElementById('result-table');
    for (var i = 0; i < final_rankings.length; i++) {
        //console.log(json[i]["username"]);
        var row = rt.insertRow();
        row.style.color = "white";
        row.style.marginTop = "50px";
        row.style.marginLeft = "50px";
        row.style.marginRight = "50px";
        var img_url = "";
        if (img_numbers[i] == 1)
            img_url = '/images/hbo-max.png';
        else if (img_numbers[i] == 2)
            img_url = '/images/disney.png';
        else if (img_numbers[i] == 3)
            img_url = '/images/netflix.png';
        else if (img_numbers[i] == 4)
            img_url = '/images/hulu.png';
        else if (img_numbers[i] == 5)
            img_url = '/images/prime-video.png';
        else if (img_numbers[i] == 6)
            img_url = '/images/youtube-tv.png';
        //console.log(img_url);
        var img = document.createElement('img');
        img.height = 50;
        img.width = 70;
        img.setAttribute('src', img_url);
        row.insertCell(0).append(img);
        row.insertCell(0).innerHTML = i+1;
        row.insertCell(0).innerHTML = final_rankings[i];
    }
    document.getElementById('tourn-page').hidden = true;
    document.getElementById('result-page').hidden = false;
}

async function updateResults(final_rankings) {
    const data = {
        roomcode
    }
    const data2 = {
        final_rankings
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data),
        body: JSON.stringify(data2)
    }
    const route = '/update-results/'+roomcode;
    await fetch(route, options);
    socket.emit('results');
}

async function updateTournament() {
    if (tourn_on_movie < 8) { // first round
        var rank_score = 'rank-'+tourn_on_movie.toString()+'-score';
        document.getElementById(rank_score).innerHTML = num_yes;
        if (tourn_on_movie % 2 != 0) {
            document.getElementById('tourn-body').hidden = true;
            document.getElementById('tourn-page').hidden = false;
            var movie_decision = (num_yes > num_prev_yes) ? tourn_movie_list[tourn_on_movie] : tourn_movie_list[tourn_on_movie-1];
            tourn_movie_list_semis.push(movie_decision);
            var tourn_id = 'sem-'+tourn_on_movie.toString();
            document.getElementById(tourn_id).innerHTML = movie_decision;
            await five_second_timer();
        }
        tourn_on_movie++;
        try {
            if (tourn_on_movie < 8)
                searchbar(tourn_movie_list[tourn_on_movie]);
            else
                searchbar(tourn_movie_list_semis[0]);
        } catch(error) {
            document.getElementById("youtube-embed").src = '/images/video-not-found.png';
        }
        num_prev_yes = num_yes;
        num_yes = 0;
        num_votes = 0;
    } else if (tourn_on_movie >= 8 && tourn_on_movie < 12) { // semi-final
        var rank_score = 'sem-'+(tourn_on_movie-8).toString()+'-score';
        document.getElementById(rank_score).innerHTML = num_yes;
        //console.log('tourn_on_movie', tourn_on_movie);
        if (tourn_on_movie == 9 || tourn_on_movie == 11) {
            document.getElementById('tourn-body').hidden = true;
            document.getElementById('tourn-page').hidden = false;
            var movie_decision = (num_yes > num_prev_yes) ? tourn_movie_list_semis[tourn_on_movie-8] : tourn_movie_list_semis[tourn_on_movie-9];
            tourn_movie_list_finals.push(movie_decision);
            var tourn_id = 'final-'+(tourn_on_movie-8).toString();
            //console.log(tourn_id);
            document.getElementById(tourn_id).innerHTML = movie_decision;
            await five_second_timer();
        }
        tourn_on_movie++;
        try {
            if (tourn_on_movie < 12)
                searchbar(tourn_movie_list_semis[tourn_on_movie-8]);
            else
                searchbar(tourn_movie_list_finals[0]);
        } catch(error) {
            document.getElementById("youtube-embed").src = '/images/video-not-found.png';
        }
        num_prev_yes = num_yes;
        num_yes = 0;
        num_votes = 0;
    } else if (tourn_on_movie >= 12 && tourn_on_movie < 14){ // final
        var rank_score = 'final-'+(tourn_on_movie-12).toString()+'-score';
        document.getElementById(rank_score).innerHTML = num_yes;
        if (tourn_on_movie == 13) {
            document.getElementById('tourn-body').hidden = true;
            document.getElementById('tourn-page').hidden = false;
            var movie_decision = (num_yes > num_prev_yes) ? tourn_movie_list_finals[1] : tourn_movie_list_finals[0];
            var not_movie_decision_idx = (num_yes > num_prev_yes) ? 0 : 1;
            //console.log("this movie won: ", movie_decision);
            document.getElementById('tourn-page').hidden = false;
            final_rankings.push(movie_decision);
            final_rankings.push(tourn_movie_list_finals[not_movie_decision_idx]);
            for (var i = 0; i < tourn_movie_list_semis.length; i++) {
                if (!final_rankings.includes(tourn_movie_list_semis[i]))
                    final_rankings.push(tourn_movie_list_semis[i]);
            }
            //console.log(final_rankings);
            if (isleader) // update the results entity
                await updateResults(final_rankings);
        }
        tourn_on_movie++;
        try {
            if (tourn_on_movie == 13)
                searchbar(tourn_movie_list_finals[1]);
        } catch(error) {
            document.getElementById("youtube-embed").src = '/images/video-not-found.png';
        }
        num_prev_yes = num_yes;
        num_yes = 0;
        num_votes = 0;
    }
}

async function startTournament() {
    console.log('start tournament');
    document.getElementById('user-body').hidden = true;
    document.getElementById('btn_user_page').hidden = true;
    document.getElementById('timer').hidden = true;
    document.getElementById('tourn-body').hidden = true;
    document.getElementById('tourn-page').hidden = false;
    document.getElementById('group-body').hidden = true;

    // commented below until API works
    const data = {
        roomcode,
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data)
    }
    const route = '/start-tournament/'+roomcode;
    const response = await fetch(route, options);
    const json = await response.json();
    //console.log(json);

    for (var i = 0; i < json.length; i++) {
        tourn_movie_list.push(json[i]["moviename"]);
    }

    //console.log(tourn_movie_list);
    //console.log('tourn_movie_list.length', tourn_movie_list.length);
    for (var i = tourn_movie_list.length; i < 8; i++) {
        tourn_movie_list.push(tourn_movie_list_sample[i]);
    }

    //console.log(tourn_movie_list);
    // using sample movie list
    var id_name = "";
    for (var i = 0; i < tourn_movie_list.length; i++) {
        id_name = 'rank-'+i.toString();
        //console.log(id_name);
        document.getElementById(id_name).innerHTML = tourn_movie_list[i];
    }
    try {
        searchbar(tourn_movie_list[0]);
    } catch(error) {
        document.getElementById("youtube-embed").src = '/images/video-not-found.png';
    }
    await five_second_timer();
}

async function requestLeaderboard() {
    const data = {
        roomcode,
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data)
    }
    const route = '/refresh-leaderboard/'+roomcode;
    const response = await fetch(route, options);
    //const json = await response.json();
    //console.log(json);
    await updateLeaderboard(response);
}

async function updateLeaderboard(data) {
    //var json = JSON.parse(data);
    //console.log(json[0].movie_name);
    const json = await data.json();
    //console.log(json);
    var Parent = document.getElementById('leaderboard-table');
    while(Parent.hasChildNodes())
    {
        Parent.removeChild(Parent.lastChild);
    }
    for (var i = 0; i < json.length; i++) {
        //console.log(json[i]["username"]);
        row = Parent.insertRow();
        row.style.color = "white";
        row.insertCell(0).innerHTML = i+1;
        row.insertCell(0).innerHTML = json[i]["movie_name"];
    }
}
// defines the timer function
async function timer(){
    document.getElementById('timer').hidden = false;
    document.getElementById('btn_start').hidden = true;
    //var sec = 420; // sec = 7 minutes
    //var sec = document.getElementById('set-time-btn').value * 60;
    var sec = TOTAL_TIME;
    var sec_holder = 0;
    var str_sec = "";
    document.getElementById('btn_user_page').hidden = false;
    var min = 0;
    var timer = setInterval(async function(){
        min = Math.floor(sec / 60);
        sec_holder = sec - min*60;
        str_sec = sec_holder.toString();
        if (sec_holder < 10) { str_sec = '0'+str_sec; }
        document.getElementById('timer').innerHTML = min+':'+str_sec;
        sec--;
        if (sec < 0) {
            clearInterval(timer);
            await startTournament();
        }
    }, 1000);
}
// update the users in the room
async function refreshUsers() {
    num_people_in_room = 0;
    const data = {
        roomcode,
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data)
    }
    const route = '/user-names/'+roomcode;
    const response = await fetch(route, options);
    //console.log("got response:: user-names");
    const json = await response.json();
    //console.log(json);
    //var tableRef = document.getElementById('user-table').getElementsByTagName('tbody')[0];
    var Parent = document.getElementById('user-table');
    while(Parent.hasChildNodes())
    {
        Parent.removeChild(Parent.lastChild);
    }
    for (var i = 0; i < json.length; i++) {
        //console.log(json[i]["username"]);
        num_people_in_room++;
        row = Parent.insertRow();
        row.insertCell(0).innerHTML = json[i]["username"];
        //console.log(i);
    }
}

// refresh the services in the room
async function refreshServices() {
    const data = {
        roomcode
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data),
    }
    const route = '/refresh-services/'+roomcode;
    const response = await fetch(route, options);
    const json = await response.json();
    var services = json.services;
    curr_services = services;
    console.log("refresh-services", services);
    var serviceDivs = document.getElementById('servicesDiv').getElementsByTagName('div');
    for(var i=1; i< serviceDivs.length; i++)
    {
        var serviceDiv = serviceDivs[i];
        if (services[i-1] == '1') {
            serviceDiv.style.backgroundColor = '#99f2d9';
            serviceDiv.style.borderRadius = '5px';
        } else {
            serviceDiv.style.backgroundColor = '#252525';
        }
    }
}

// update the services in the room
async function updateServices(servicesStr) {
    //console.log(servicesStr);
    const data2 = {
        servicesStr
    }
    const data = {
        roomcode
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data),
        body: JSON.stringify(data2)
    }
    const route = '/update-services/'+roomcode;
    const response = await fetch(route, options);
    //console.log("got response:: updateServices");
    const json = await response.json();
    var services = json.services;
    curr_services = services;
    var serviceDivs = document.getElementById('servicesDiv').getElementsByTagName('div');
    for(var i=1; i< serviceDivs.length; i++)
    {
        var serviceDiv = serviceDivs[i];
        if (services[i-1] == '1') {
            serviceDiv.style.backgroundColor = '#99f2d9';
            serviceDiv.style.borderRadius = '5px';
        } else {
            serviceDiv.style.backgroundColor = 'transparent';
        }
    }
    socket.emit('services');
}

async function getMovieName() {
  const data = {
     roomcode,
     userid
  }
  const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    params: JSON.stringify(data)
  }
  const route = '/get-movies/'+roomcode+'/'+userid;
  const response = await fetch(route, options);
  //console.log("got response:: user-info");
  //console.log(response);
  const json = await response.json();
  return json[0].movie_name;
}

// when the group page loads
window.onload = async function() {
    document.getElementById('overlay').hidden = false;
    if (!pageLoaded) {
        document.getElementById('btn_user_page').hidden = true;
    }
    document.getElementById('user-body').hidden = true;
    document.getElementById('tourn-body').hidden = true;
    document.getElementById('tourn-page').hidden = true;
    document.getElementById('group-body').hidden = true;
    document.getElementById('result-page').hidden = true;
    // get the user and room information
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    const response = await fetch('/user-info', options);
    //console.log("got response:: user-info");
    const json = await response.json();
    //console.log(json);

    // update the roomcode
    document.getElementById("room_code").innerHTML = json.roomcode;
    userid = json.userid;
    username = json.username;
    roomcode = json.roomcode;
    roomid = json.roomid;
    isleader = json.isleader;
    //console.log("isleader: ", isleader);
    if (!isleader) {
        var checkboxes = document.getElementsByTagName("input");
        for(var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].hidden = true;
        }
        document.getElementById("btn_start").hidden = true;
    }
    // get all the users
    await refreshUsers();
    await refreshServices();

    pageLoaded = true;


    //socket.broadcast.emit('users');
    socket.emit('users');
    document.getElementById('overlay').hidden = true;
    document.getElementById('group-body').hidden = false;
}

document.getElementById('btn_user_page').onclick = async function() {

    if(ifFirst == true){
        try {
            await addTitle(true);
            ifFirst = false;
        } catch(error) {
            const divImage = document.getElementById('movieImage');
            let img = createNode('img');
            img.src = '/images/img-not-found.png';
            img.setAttribute("id","image");
            img.width = 450;
            img.height = 600;
            divImage.appendChild(img);
        }
    }

    var g = document.getElementById('group-body');
    var u = document.getElementById('user-body');


    g.hidden = true;
    u.hidden = false;

}

document.getElementById('btn_back').onclick = async function() {

    var g = document.getElementById('group-body');
    var u = document.getElementById('user-body');
    g.hidden = false;
    u.hidden = true;

}

async function storeVote(movieTitle, vote) {

  const data2 = {
      movieTitle,
      vote
  }
  const data = {
      roomcode
  }
  const options = {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      params: JSON.stringify(data),
      body: JSON.stringify(data2)
  }
  var route = '/user-vote/'+roomcode;
  await fetch(route, options);
  //console.log("sending update leaderboard");
  socket.emit('leaderboard');
}

document.getElementById('like').onclick = async function() {
    await storeVote(movies[count], true);
    count += 1;
    await addTitle(false);
  }

document.getElementById('dislike').onclick = async function() {
    await storeVote(movies[count], false);
    count += 1;
    await addTitle(false);
  }

document.getElementById('btn_start').onclick = async function() {
    var str_services = "";
    if (document.getElementById('set-time-btn').value == 0)
    {
        alert("You need at least a minute!");
        return;
    }
    TOTAL_TIME = document.getElementById('set-time-btn').value;
    document.getElementById('btn_start').style.backgroundColor = '#ff9933';
    for (var i = 0; i < services_names.length; i++) {
        if (document.getElementById(services_names[i]).checked) {
            str_services += '1';
        } else {
            str_services += '0';
        }
    }
    await updateServices(str_services); 

    if (curr_services == "000000") {
        alert("Please choose at least 1 service");
        return;
    }
    socket.emit('timer', TOTAL_TIME);
}

document.getElementById('btn_no').onclick = function() {
    socket.emit('no');
}
document.getElementById('btn_yes').onclick = function() {
    socket.emit('yes');
}
document.getElementById('btn_leave').onclick = async function() {
    const data = {
        roomcode
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: JSON.stringify(data),
    }
    const route = '/leave-room/'+roomcode;
    await fetch(route, options);
    window.location.href = '/';
}

window.onclose = async function() {
    if (isleader) {
        const data = {
            roomcode
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            params: JSON.stringify(data),
        }
        const route = '/close-room/'+roomcode;
        await fetch(route, options);
    }
}


// SOCKET.IO LISTENERS
socket.on('connect', () => {
    console.log('group-client:: a new socket connection opened');
})
socket.on('users', async () => {
    //console.log('group-client:: socket sent users');
    await refreshUsers();
})
socket.on('timer', (time) => {
    //console.log('group-client:: socket sent timer');
    console.log(time);
    TOTAL_TIME = time;
    timer();
})
socket.on('leaderboard', async () => {
    //console.log('group-client:: socket sent leaderboard');
    await requestLeaderboard();
})
socket.on('services', async () => {
    //console.log('group-client:: socket sent services');
    await refreshServices();
})
socket.on('yes', () => {
    //console.log('group-client:: socket sent yes');
    num_votes++;
    num_yes++;
    if (num_votes >= num_people_in_room && isleader)
        socket.emit('next-movie');
})
socket.on('no', () => {
    //console.log('group-client:: socket sent no');
    num_votes++;
    if (num_votes >= num_people_in_room && isleader)
        socket.emit('next-movie');
})
socket.on('next-movie', async () => {
    //console.log('group-client:: socket sent next-movie');
    await updateTournament();
})
socket.on('results', async () => {
    //console.log('group-client:: socket sent results');
    await refreshResults();
})
