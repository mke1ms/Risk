
var whoami = 0;
var myname = "";
var players = new Object();
var owner = new Object();
var armies = new Object();
var sounds = {};
var player = 0;
var statepos = new Array();			
var current = null;
var attacking = false;
var attack_from = "";
var attack_to = "";
var movefrom = false;


$(document).ready( function() {
    $( "#dialog" ).draggable();	
	
	myname = prompt("You have been chosen to lead our Armies.\n What is your name?", "Dude");
		
	players[0] = { name: myname+" (black)", color: "black", type: "Human" };
	players[1] = { name: "red sonia (red)", color: "red", type: "ai" };
	players[2] = { name: "green lantern (green)", color: "green", type: "ai" };
	players[3] = { name: "toxic avenger (purple)", color: "purple", type: "ai" };
		
	game.player = players[player].color;
	$('#whosturn').html("It's "+ players[player].name + " turn.");
		
	sounds.bombs = document.getElementById('bombs');
	sounds.bass = document.getElementById('bass');
	sounds.fight = document.getElementById('fight');
	sounds.celebrate = document.getElementById('celebrate');
	sounds.deathcry = document.getElementById('deathcry');
	sounds.march = document.getElementById('march');
	sounds.winner = document.getElementById('won_game');
		
	game.allocatecountries();
	
	for (var state in map) {
		map[state].color = owner[state];
		map[state].animate({fill: owner[state]}, 500);
		pos = map[state].getBBox();
				x = Math.round(pos.x + (pos.width/2));
				y = Math.round(pos.y + (pos.height/2));
				$('#canvas').append('<div id="army_num_'+state+'" class="army_bubble" style=\'position:absolute;top:'+y+'px;left:'+x+'px;\'>' + armies[state] + '</div>');
		statepos[state] = new Array();
		statepos[state]['x'] = x+15;
		statepos[state]['y'] = y+5;				
		
		//Raphael.getColor();
		(function (st, state) {
			st[0].style.cursor = "pointer";
			st[0].onmouseover = function () {
				//st.animate({fill: st.color, stroke: "#ccc", "fill-opacity":1}, 500);
				st.animate({fill: st.color, "fill-opacity":1}, 200);
				R.safari();
				current = state;
				ui.countryinfo(state+' is owned by '+owner[state]+'. There are '+armies[state]+' armies stationed in '+state+' Strength: '+ai.getstrength(state));
			};
			st[0].onmouseout = function () {
				//st.animate({fill: st.color, stroke: "lime","fill-opacity":0.75}, 500);
				st.animate({fill: st.color, "fill-opacity":0.75}, 200);
				R.safari();
			};
			st[0].onclick = function () {
				st.toFront();
				//console.log(attacking);
				if (addingarmies == true) {
					ui.addarmy(state);				
				} else if (movingarmies == true) {
				
					if (movefrom == false) {
						ui.showMovePossibilities(state);
						movefrom = state;
					} else {
						ui.movearmy(movefrom,state);				
					}
					
				} else if (attacking == true) {
				
					ui.battle(attack_from,state);
					
				} else {
				
					if (owner[state] != game.player) {
						ui.feedback('You don\'t own '+state+'. Click one of your countries to start an attack');
						return;
					}
					ui.showAttackPosibilities(state);
					ui.dialog('selected_country');
					//ui.feedback('attack from '+state);
					attacking = true;	
					attack_from = state;
					attack_to = "";
				}
				R.safari();
			};
		   
		})(map[state], state);
	}

	$("#slider").slider({ 
		min:1, 
		max: 7,
		change: function(event, ui) { $('#invade_with').val(ui.value); }
	});
	
	ui.events();
	game.displayarmies();
	ui.startgame();
});

var game = new Object();

game.statesleft = function(states) {
	redo = new Array();
	nstates=0;
	for (var state in states) {
		if (typeof state == 'undefined') {
			continue;
		}		
		redo[nstates] = state;
		nstates++;
	}
	//console.log(redo);
	//console.log(redo.length);
	return redo;
}

game.allocatecountries = function () {

	statesleft = game.statesleft(map);
	p = 0;
	while (statesleft.length > 0) {
		//for (var i = 0; i < players.length; i++) {
		 
			pick = Math.floor( (Math.random() * (statesleft.length-1)));
			owner[statesleft[pick]] = players[p].color;
			//console.log(statesleft[pick]+' to '+players[p].color);
			armies[statesleft[pick]] = 2;
			statesleft.splice(pick,1);
			nstates=0;
			redo= new Array();
			for (var state in statesleft) {
				if (typeof statesleft[state] == 'undefined') {
					continue;
				}		
				redo[nstates] = statesleft[state];
				nstates++;
			}
			statesleft = redo;
			
			p++;
			if (typeof players[p] == 'undefined') {
				p=0;
			}
			//console.log(statesleft.length);
		//}
		i =0;
	}			
}

game.displayarmies= function () {
	for (var state in armies) {
		cur = $('#army_num_'+state).html() *1;
		if (cur != armies[state]) {
			$('#army_num_'+state).html(' '+armies[state]+' ');
			$('#army_num_'+state).animate({ "background-color": "red", padding: "3px"}, 200 ).animate({  "background-color": "blue",padding: "3px"}, 200 );
		}			
	}
}

game.nextplayer = function() {
	
	if (game.haswinner() == true) {
		ui.winner(players[player]);
		return;
	}
	
	attacking = false;
	attack_from = false;
	movingarmies = false;
	movefrom = false;
	
	player++;
	if (typeof players[player] == 'undefined') {
		player = 0;
	}
	game.player = players[player].color;
	
	ui.nextplayer();
	
	if (player == whoami) {
		ui.placearmies();
	}		
	if (players[player].type=="ai") {
		ai.doturn();
	}
}

game.armies_earned = function() {
	countries = 0;
	for (var state in owner) {
		if (owner[state]==players[player].color) {
			countries++;
		}			
	}
	add = Math.ceil(countries/3);
	add = add + game.armies_from_continents();
	//add = Math.ceil(countries);
	return add;
}

game.armies_from_continents = function() {	
	add = 0;
	countries = game.getcountries();
	for (var continent in continents) {
		if (game.hascountries(continents[continent], countries) == true) {
			ui.unifycontinent(continent);
			ui.feedback('You hold '+continent+'. '+continent_value[continent]+' army bonus!');
			add = add + continent_value[continent];
		}
	}
	return add;
}	

game.hascountries = function(continent,countries) {
	hit = 0;
	for (var i = 0; i < continent.length; i++) {
		if ($.inArray(continent[i], countries) > -1) {
			//console.log(continent[i] + 'is in countries');
			hit++;
		}		
	}
	if (hit < i) {
		return false;
	} else {
		return true;
	}
}


game.getcountries = function() {		
	countries = new Array();
	i = 0;
	for (var state in owner) {
		if (owner[state] == game.player) {
			//ui.feedback(game.player+' owns '+state)
			countries[i] = state;
			i++;
		}
	}
	return countries;
}

game.removefromarray = function(list, item) {
	//list.splice(list.indexOf(item), 1);
	newlist = new Array();
	n = 0;
	for (var i = 0; i < list.length; i++) {
		if (list[i] != item) {
			newlist[n] = list[i];
			n++;
		}
	}
	return newlist;
}

var movingarmies = false;

game.movearmies = function() {
	ui.dialog('move_armies');
	movingarmies = true;
}

game.movearmy = function(from,to) {
	armies[to]++;
	armies[from]--;
}

game.endmove = function() {
	movefrom = false;
}

game.haswinner = function() {
	for (var state in owner) {
		if (owner[state] != game.player) {
			return false;
		}
	}
	return true;
}

var war = new Object();	
	
war.battle = function (from, to) {
	war.winner = false;
	ui.dialog('attack');
	$('#invade_with').val('0');	
	war.sound('bombs');	
	fightbattle = setInterval(function() {			
		war.fight(from, to);
		game.displayarmies();
		if (war.winner != false) {	
			if (war.winner == owner[from]) {
				war.sound('celebrate');							
				ui.feedback('<b>Victory! '+players[player].name+' takes '+ to+'</b>');
				war.invade(from,to);
			} else {						
				war.sound('deathcry');
				ui.feedback('<b>Defeat! '+to+ ' defenses were too strong for '+players[player].name+'\'s army :(</b>');
				ui.dialog('select_country');
			}
			owner[to] = war.winner;
			map[to].color = owner[to];
			window.clearInterval(fightbattle);
			war.stopsound('bombs');
			ui.clearattacklines();
						
			return war.winner;
		}						
	}, 410);		
};

war.dice = function(state) {
	return Math.floor((Math.random()*6)+1); 
}

war.fight = function(from, to) {
	if (armies[to]==0) {
		map[to].animate({fill: owner[from]}, 500);
		war.winner = owner[from];
		return;
	}
	if (armies[from]==0) {
		war.winner = owner[to];
		return;
	}
	if (war.dice(from) > war.dice(to)) {
		armies[to]--;
	} else {
		armies[from]--;
	}
	
}	


war.invade = function(from, to) {
	if (players[player].type=="ai") {
		invade = Math.floor(armies[from]/2);
		armies[to] = invade;
		armies[from] = armies[from] - invade;
		game.displayarmies();
		return;
	}
	
	invade = $('#invade_with').val();
	if (invade > 0) {
		armies[to] = invade;
		armies[from] = armies[from] - invade;
		game.displayarmies();
		ui.dialog('select_country');
	} else {
		$("#slider").slider( "option", "max", armies[from] );
		$("#slider").slider( "option", "value", 1 );
		ui.dialog('invade');
	}	
}

var lineattr = {
	fill: "lime",
	"fill-opacity":0.1,
	stroke: "red",
	"stroke-width": 2,
	"stroke-linejoin": "round"
};

war.sound = function(sound) {				
	sounds[sound].play();
}
war.stopsound = function(sound) {				
	sounds[sound].pause();
}

var atline;
war.attackline = function(from, to) {
	ui.clearattacklines();
	lineattr.stroke = "red";
	lineattr.fill = "lime";
	avg = (statepos[from]['x'] + statepos[to]['x']) / 2;
	avg2 = avg / 3;				
	//ui.feedback(avg+' '+avg2);
	atline = R.path("M "+statepos[from]['x']+" "+statepos[from]['y']+" Q "+avg+" "+avg2+" "+statepos[to]['x']+" "+statepos[to]['y']).attr(lineattr);
	atline.node.setAttribute("class","atline");
	var anim = Raphael.animation({stroke:"none"}, 1700).repeat(Infinity);				
	atline.animate(anim);
	ui.attacklinelabel(from,to,statepos[to]['x'],statepos[to]['y']);
}

var ai = new Object();

ai.doturnold = function() {

	
	ai.allocatearmies();
	// choose the country with most armies
	setTimeout(function() {	
		continent = ai.choosecontinent();
		attack_from = ai.choosecountry(continent);
		if (attack_from == "") {
			game.nextplayer();
		} else {			
			// select the enemy country with the least armies		
			setTimeout(function() {
				attack_to = ai.chooseopponent(attack_from);	
				if (attack_to != false) {
					ai.attack(attack_from,attack_to);				
				} else {
					game.nextplayer();
				}
			}, 2000);
		}
	}, 1000);

}

ai.doturn = function() {
	// choose the continent that we are closest to getting
	continent = ai.choosecontinent();
	// select the weakest enemy country
	attack_to = ai.choosetarget(continent);
	// add armies	
	ai.allocatearmies(attack_to);
	// select attack point
	attack_from = ai.chooseattacker(attack_to);
	
	// action!
	setTimeout(function() {	
		if (ai.getstrength(attack_from) <= ai.getstrength(attack_to)) {
			//ui.feedback('not attacking because strength '+ ai.getstrength(attack_from) + attack_from +'<='+ ai.getstrength(attack_to)+attack_to)
			attack_from = "";
		} else {
			//ui.feedback('attacking because strength '+ ai.getstrength(attack_from) + attack_from +' > '+ ai.getstrength(attack_to)+attack_to)
		}
		if (attack_from == "") {
			ai.movearmies();
			game.nextplayer();
		} else {			
			setTimeout(function() {
				if (attack_to != false) {
					attacking = true;
					ui.showAttackPosibilities(attack_from);	
					ai.attack(attack_from,attack_to);				
				} else {
					ai.movearmies();
					game.nextplayer();
				}
			}, 2000);
		}
	}, 1000);

}

ai.choosecontinent = function() {
	// we want to choose the continent we want, based on how close we are to get it
	score = 0;
	progress = 0;
	best = 0;
	for (var continent in continents) {
		name = continent;
		continent = continents[continent];
		mine=0;
		for (var i = 0; i < continent.length; i++) {
			if (owner[continent[i]]==game.player) {
				mine++;
			} 
		}
		progress = (mine / i)* 100;
		if (progress > best) {
			if (progress < 100) {
				best = progress;
				selected = name;
			}
		}
	}
	ui.feedback('ai says go for '+selected);
	return selected;
	
}


ai.choosetarget = function(continent) {
	// select the enemy country with the least armies
	min = false;
	continent = continents[continent];
	for (var i = 0; i < continent.length; i++) {
		state = continent[i];			
		if (owner[state] == game.player) {
			continue;
		}
		// check if this state has borders with any of players countries
		ok = 0;
		for (var x = 0; x < borders[state].length; x++) {
			if (owner[borders[state][x]] == game.player) {
				ok = 1;
			}
		}
		if (ok!=1) {
			continue;
		}
		if (min == false) {
			min = armies[state];
			select = state;	
		} else if (armies[state] <= min) {
			min = armies[state];
			select = state;							
		}			
	}
	// check if inarray borders or try the next
	
	// if (ai.getstrength(from) <= ai.getstrength(select)) {
		// ui.feedback('not attacking because strength '+ ai.getstrength(from) + from +'<='+ ai.getstrength(select)+select)
		// return false;
	// } else {
		// ui.feedback('attacking because strength '+ ai.getstrength(from) + from +' > '+ ai.getstrength(select)+select)
	// }
	return select;
}

ai.chooseattacker = function(target, silent, duringmove) {
	// choose the country with most armies
	max = 0;
	select = "";
	if (silent != true) {
		//ui.feedback("find attcker to "+target);
	}
	//console.log("hier"+target);
	for (var i = 0; i < borders[target].length; i++) {
		state = borders[target][i];
		if (owner[state] == game.player) {
			if (armies[state] >= max) {
				max = armies[state];
				select = state;
			}				
		}			
	}
	if (select=="") {
		if (duringmove==true) {
			//ui.feedback("Can't find a better country to move to from "+target);
		} else {
			ui.feedback("Can't find attacker for "+target);
		}	
		return select;
	}
	return select;
}

ai.choosecountry = function(continent) {
	// choose the country with most armies
	max = 0;
	select = "";
	c = continent;
	continent = continents[continent];
	for (var i = 0; i < continent.length; i++) {
		state = continent[i];
		if (owner[state] == game.player) {
			ui.feedback(state+' belongs to'+game.player)
			if (armies[state] >= max) {
				max = armies[state];
				select = state;
			}				
		}			
	}
	if (select=="") {
		//ui.feedback(game.player+ ' has no countries .... what a loser');
		ui.feedback("Can't find country in "+c+" to choose");
		return select;
	}
	//ui.feedback('attack from '+select);
	attacking = true;
	ui.showAttackPosibilities(select);	
	attack_from = select;
	attack_to = "";
	return select;
}

ai.chooseopponent = function(from) {
	// select the enemy country with the least armies
	min = false;
	for (var i = 0; i < borders[from].length; i++) {
		state = borders[from][i];			
		if (owner[state] == game.player) {
			continue;
		}
		if (min == false) {
			min = armies[state];
			select = state;	
		} else if (armies[state] <= min) {
			min = armies[state];
			select = state;							
		}			
	}
	if (ai.getstrength(from) <= ai.getstrength(select)) {
		//ui.feedback('not attacking because strength '+ ai.getstrength(from) + from +'<='+ ai.getstrength(select)+select)
		return false;
	} else {
		//ui.feedback('attacking because strength '+ ai.getstrength(from) + from +' > '+ ai.getstrength(select)+select)
	}
	return select;
}

ai.attack = function (from,to) {	
	ui.battle(from,to);
	waitforbattle = setInterval(function() {				
		if (war.winner != false) {
			window.clearInterval(waitforbattle);
			ai.movearmies();
			game.nextplayer();
		}						
	}, 100);
}

ai.allocatearmies = function(target) {
	game.armiestoadd = game.armies_earned();
	offence = Math.floor(game.armiestoadd/2);
	weakest = "";
	//defensive	
	countries = game.getcountries();
	while (game.armiestoadd > 0) {
		weakest = ai.getWeakestcountry(countries);
		if (weakest == false) {
			continue;
		}
		armies[weakest]++;
		game.armiestoadd--;
		//ui.feedback("placed army in "+weakest);
		// offensive
		if (target!="") {
			if (game.armiestoadd <= offence) {
				countries = borders[target];
			}	
		}
		game.displayarmies();
		
	}
	ui.feedback("done placing armies");
}

ai.getWeakestcountry = function(countries) {	
	min = "";
	weakest = "";
	state= "";
	for (var i = 0; i < countries.length; i++) {
		state = countries[i];
		if (owner[state]!=game.player) {
			continue;
		}
		strength = ai.getstrength(state);
		if (strength == false) {
			// country is safe
			continue;
		}
		//console.log(game.player+' has '+state+' has strength '+strength);
		if (strength < min || min=="") {
			min = strength;
			weakest = state;
		}
	}
	//console.log(weakest);
	if (weakest!="") {
		return weakest;
	} else {
		return false;
	}
	
}

ai.getstrength = function(country) {
	enemy_armies = 0;
	owns=0;
	//console.log(country);
	for (var i = 0; i < borders[country].length; i++) {
		to = borders[country][i];	
		if (owner[to] != owner[country]) {
			enemy_armies = enemy_armies + (armies[to]*1);
		} else {
			owns++;
		}
	}
	if (owns == i) {
		console.log("all countries with borders to "+country+" are owned by "+owner[country]);
		return false;
	}
	if (enemy_armies == 0) {
		strength = armies[country];
	} else {
		strength = armies[country] / enemy_armies;
		strength = strength.toFixed(3);
	}
	//ui.feedback(country+' strength : '+strength+' = '+armies[country]+' / '+enemy_armies);			
	return strength;
}

ai.movearmies = function() {
	// we want to move away from unthreatend (safe) countries into threatand ones (unsafe)
	// 1. loop thru countries
	// 2. if country untrhreatend, move armies towards a goal country
	game.movearmies();
	countries = game.getcountries();
	i=0;
	while (i < 7) {
		if (countries.length == 0) {
			console.log('break');
			break;
		}
		
		target = ai.getWeakestcountry(countries);
		if (target==false) {
			console.log('break no target found');
			break;
		}
		from = ai.chooseattacker(target, true, true);
		if (from=="") {
			// try a different target
			countries = game.removefromarray(countries, target);
		} else {
			//ui.feedback('trying to move from '+from+' to '+target);
			strength = ai.getstrength(from)
			if (strength >= 1 || strength == false) {
				if (armies[from] > 0) {
					armies[from]--;
					armies[target]++;
					ui.feedback('moved an army from '+from+' to '+target);
					// a from country may not be a target the next time round
					countries = game.removefromarray(countries, from);
	//				countries.splice(countries.indexOf(from), 1);
					i++;
				} else {
					countries = game.removefromarray(countries, target);
				}
				
			} else {
				// try a different target
				//countries.splice(countries.indexOf(target), 1);
				countries = game.removefromarray(countries, target);
			}
		}
	}
	//console.log(countries);
	ui.feedback('done moving armies');
	game.displayarmies();
}
ai.getcriticalcountries = function() {
	//find the countries, per continent that have borders with other continents
}
ai.movedirection = function(from,to) {
	// gets the x,y coords of the 2 countries
	// loops thru borders of 'from' to see which of those x,y coords gets us closer to 'to' coords
	// returns the 'move direction', ie the country we need to move to now, to get closer to 'to' country
}

var ui = new Object();

ui.events = function() {
	$('.cancel_attack').on("click", function(event){
		war.winner = attack_to;
		attacking=false;
		attack_from = "";
		attack_to = "";
		ui.clearattacklines();
		ui.dialog('select_country');
		ui.feedback('Attack Cancelled');
	});
	
	$('#confirm_invade').on("click", function(event){
		war.invade(attack_from,attack_to);
	});
	
	$('#end_turn').on("click", function(event){
		game.nextplayer();
	});
	
	$('#end_attack').on("click", function(event){
		game.movearmies();
	});
	
	$('#end_move').on("click", function(event){
		ui.endmove();
	});
	
	$('#new_game').on("click", function(event){
		window.location.href=window.location.href;
	});
}	

ui.battle = function(from,to) {
	if (jQuery.inArray(to, borders[from]) < 0) {
		ui.feedback(to+' does not share a border with '+from);
		return;
	}
	if (owner[to]==game.player) {
		ui.feedback('Sir, have you gone mad ?! We can\'t attack our own country!');
		return;
	}		
	war.attackline(from,to);
	ui.feedback('Attacking from '+from+' to '+ to);							
	war.battle(from,to);	
	attack_to = to;					
	attacking= false;	
}

var addingarmies = false;
ui.placearmies = function() {
	countries = game.getcountries();
	if (countries.length <= 0) {
		ui.feedback('You have no more countries. You are a complete failure and have lost the game!');
		//game.nextplayer();
		return;
	}		
	game.armiestoadd = game.armies_earned();
	ui.feedback('You can place '+game.armiestoadd+' armies');
	ui.dialog('add_armies');
	$('#armies_left').html(game.armiestoadd);
	addingarmies = true;
}

ui.addarmy = function(to) {
	if (owner[to]!=game.player) {
		ui.feedback('You can only add armies to your own countries you fool!');
		return;
	}
	armies[to]++;
	game.armiestoadd--;
	$('#armies_left').html(game.armiestoadd);
	if (game.armiestoadd <= 0) {
		addingarmies = false;
		ui.dialog('select_country');			
	}
	game.displayarmies();
}

ui.feedback = function(str) {
	if (players[player].color!='black') {
		c = players[player].color;
		fc = players[player].color;
	} else {
		c = "#333";
		fc = "silver";
	}
	str = "<div class='feedback_item' style='border-color:"+c+";color:"+fc+";'>"+str+"</div>";
	$('#feedback').prepend(str);
	$("#feedback").scrollTop();
}
ui.countryinfo = function(str) {	
	$('#countryinfo').html(str);
}

ui.dialog = function(target) {
	
	if (players[whoami].color == game.player) {
		$('#dialog #command>div').hide();
		$('#'+target).show("slide");
	} else {
		if ($('#waitforplayer').css('display')=='none') {
			$('#dialog #command>div').hide();
			$('#waitforplayer').show("slide");
		}
	}
}

ui.clearattacklines = function () {
	if (atline) {
		$('.atline').remove();
		$('#attacklineslabel').hide();
	}
}

ui.countryinfo = function(str) {
	$('#countryinfo').html(str);
}

ui.startgame = function() {
	ui.feedback('Welcome! You are player '+players[whoami].name+'');

	if (player == whoami) {
		ui.placearmies();
	}
}

ui.movearmy = function(from,to) {
	war.sound('march');	
	if (owner[to]!=game.player) {
		ui.feedback('You can only move armies to your own countries you fool!');
		return;
	}
	if (armies[from] <= 0) {
		ui.feedback('No more armies, select another country, dude!');	
		return;			
	}

	game.movearmy(from,to);	
	game.displayarmies();
	ui.dialog('end_move_armies');		
}

ui.endmove = function() {
	game.endmove();
	ui.clearattacklines();
	ui.dialog('move_armies');	
}

ui.showMovePossibilities = function(from) {
	war.sound('bass');
	ui.clearattacklines();
	lineattr.stroke = "blue";
	lineattr.fill = "none";
	for (var i = 0; i < borders[from].length; i++) {
		state = borders[from][i];
		if (owner[state]==game.player) {
			ui.atline(from,state,lineattr);	
		}
	}			
}

ui.showAttackPosibilities = function(from) {
	war.sound('bass');
	ui.clearattacklines();
	lineattr.stroke = "lime";
	lineattr.fill = "none";
	for (var i = 0; i < borders[from].length; i++) {
		state = borders[from][i];
		if (owner[state]!=game.player) {
			ui.atline(from,state,lineattr);
		}
	}			
}

ui.atline = function(from,to,lineaatr) {
	avg = (statepos[from]['x'] + statepos[to]['x']) / 2;
	avg2 = avg / 3;				
	atline = R.path("M "+statepos[from]['x']+" "+statepos[from]['y']+" Q "+avg+" "+avg2+" "+statepos[to]['x']+" "+statepos[to]['y']).attr(lineattr);
	atline.node.setAttribute("class","atline");	
}

ui.nextplayer = function() {
	ui.clearattacklines();
	//$('#notyourturn').show();
	$('#whosturn').html("It's "+ players[player].name + " turn.");
	ui.feedback("It's "+ players[player].name + " turn.");
	if (player == whoami) {
		$('#notyourturn').hide();
	}
	//$('#attacklinelabel').hide();
}

ui.winner = function(winner) {
	war.sound('winner');
	$('#winner').show("slide","slow");
	$('.winner_name').html(players[player].name);
}

ui.unifycontinent = function(continent) {
	continent = continents[continent];
	for (var i = 0; i < continent.length; i++) {
		//if (game.player == 'black') {
			//map[continent[i]].animate({stroke: "black","stroke-width":1,  "fill-opacity":1}, 100);
		//} else {
			map[continent[i]].animate({stroke: game.player ,"stroke-width":2}, 100);
		//}
	}
}

ui.attacklinelabel = function(from,to,x,y) {
	$('#attacklinelabel').html(game.player+ " is attacking from "+ from+10 + " to "+ to+10);
	$('#attacklinelabel').css("position", "absolute");
	$('#attacklinelabel').css("left", x+"px");
	$('#attacklinelabel').css("top", y+"px");
	$('#attacklinelabel').show();
}
