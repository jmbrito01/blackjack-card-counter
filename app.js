var readline = require('readline');
var async = require('async');
var fs = require('fs');

var Game = require('./game');
var savedGame = null;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var beginGame = function() {
    async.waterfall([
        function generateDeck(callback) {
            Game.loadGame('game.json').then(function(game) {
                game.to_add = {
                    uston_count: 0,
                    hilo_count: 0
                };
                game.user.cards = [];
                game.table.cards = [];
                game.table.money = 0;
                game.user.count = 0;
                game.table.count = 0;
                console.log(`Starting Uston SS count: ${game.uston_count}`);
                console.log(`Starting Hi-Lo count: ${game.hilo_count}`);
                console.log('======================================');
                callback(null);
            }, function(err) {
                rl.question('How many decks do you want? ', function(deck_count) {
                    var game = Game.generateDeck(deck_count);
                    console.log(`Starting count of Uston SS: ${game.uston_count}`);
                    console.log(`Starting Hi-Lo count: ${game.hilo_count}`);
                    console.log('======================================');
                    callback(null);
                });
            });
        },
        function selectBet(callback) {
            var game = Game.instance;
            rl.question(`How much do you want to bet? (You have $${game.user.money},00): `, function(bet) {
                Game.bet(bet);
                callback(null);
            });
        },
        function giveCards(callback) {
            var game = Game.giveCards();

            //Doing calculations
            console.log(`The table has: ${game.table.cards[0].value}`);
            var cards = "";
            for (var i = 0;i < game.user.cards.length;i++) {
                cards = cards + game.user.cards[i].value + '/';
            }
            cards = cards.substr(0, cards.length-1);
            console.log(`Your cards are: ${cards} (${game.user.count})`);
            console.log(`Current Hi-Lo count: ${game.hilo_count}`);
            console.log(`Current Uston SS count: ${game.uston_count}`);
            console.log('======================================');

            callback(null);
        }
    ], function() {
        var restart = function(game_obj) {
            rl.question('R = Restart game / S = Shuffle remaining cards ', function(answer) {
                switch (answer) {
                    case 'S':
                        Game.saveGame('game.json').then(function() {
                            beginGame();
                        });
                        break;
                    case 'R':
                        fs.unlink('game.json', function() {
                            beginGame();
                        });

                        break;

                    default:
                        console.log('Unknown command.');
                        restart();
                        break;
                };
            });
        };
        var getCommand = function(c) {
            var game = Game.instance;
            var handleCommands = function(command) {
                switch (command) {
                    case 'D':
                        Game.double();
                        handleCommands('S');
                        break;
                    case 'SV':
                        Game.saveGame('game.json');
                        console.log('Saved successfuly!');
                        break;
                    case 'I':
                        console.log(`There are ${game.deck.length} cards left of the deck`);
                        console.log(`You have ${game.user.money} in your account`);
                        console.log(`This table has ${game.table.money} in stake`);
                        console.log('======================================');
                        getCommand();
                        break;
                    case 'H':
                        if (game.deck.length < 1) {
                            console.log('You ran out of cards.');
                            beginGame();
                        }
                        var result = Game.hit();
                        var cards = "";
                        for (var i = 0;i < game.user.cards.length;i++) {
                            cards = cards + game.user.cards[i].value + '/';
                        }
                        cards = cards.substr(0, cards.length-1);
                        console.log(`Your cards are: ${cards} (${game.user.count})`);
                        console.log(`Current Hi-Lo count: ${game.hilo_count}`);
                        console.log(`Current Uston SS count: ${game.uston_count}`);
                        console.log('======================================');

                        var table_cards = "";
                        for (var i = 0;i < game.table.cards;i++) {
                            table_cards = table_cards + game.table.cards[i].value + "/";
                        }
                        table_cards = table_cards.substr(0, table_cards.length-1);
                        if (result.winner !== null) {
                            console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                            console.log(`Winner: ${result.winner}`);
                            console.log('======================================');
                            restart(game);
                        }
                        else getCommand();
                        break;
                    case 'S':

                        var result = Game.stand();

                        var table_cards = "";
                        for (var i = 0;i < game.table.cards;i++) {
                            table_cards = table_cards + game.table.cards[i].value + "/";
                        }
                        table_cards = table_cards.substr(0, table_cards.length-1);
                        console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                        if (result.winner !== null) console.log(`Winner: ${result.winner}`);
                        else console.log('It`s a tie!');
                        console.log('======================================');
                        restart(game);
                        break;
                    default:
                        console.log('Unknown command, type again.');
                        getCommand();
                        break;
                };
            };
            if (c !== undefined) {
                handleCommands(c);
            } else {
                rl.question('H = Hit / S = Stand / D = Double / SV = Save game / I = Info ', function(command) {
                    handleCommands(command);
                });
            }

        }
        getCommand();
    });
};

beginGame();