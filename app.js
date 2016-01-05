var readline = require('readline');
var async = require('async');
var fs = require('fs');

var savedGame = null;

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var cards = [
    {value: 2, add_count: 2, uston: 2, hilo: 1},
    {value: 3, add_count: 3, uston: 2, hilo: 1},
    {value: 4, add_count: 4, uston: 2, hilo: 1},
    {value: 5, add_count: 5, uston: 3, hilo: 1},
    {value: 6, add_count: 6, uston: 2, hilo: 1},
    {value: 7, add_count: 7, uston: 1, hilo: 0},
    {value: 8, add_count: 8, uston: 0, hilo: 0},
    {value: 9, add_count: 9, uston: -1, hilo: 0},
    {value: 10, add_count: 10, uston: -2, hilo: -1},
    {value: 'J', add_count: 10, uston: -2, hilo: -1},
    {value: 'Q', add_count: 10, uston: -2, hilo: -1},
    {value: 'K', add_count: 10, uston: -2, hilo: -1},
    {value: 'A', add_count: 11, uston: -2, hilo: -1}
];

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var beginGame = function() {
    async.waterfall([
        function generateDeck(callback) {
            if (savedGame == null || savedGame.deck.length <= 4) {
                rl.question('How many decks do you want? ', function(deck_count) {
                    var deck = [];
                    for (var i = 0;i < deck_count;i++) {
                        for (var j = 0;j < cards.length;j++) {
                            deck.push(cards[j]);
                        }
                    }
                    var uston_count = deck_count * -2;
                    var hilo_count = 0;
                    console.log(`Starting count of Uston SS: ${uston_count}`);
                    console.log(`Starting Hi-Lo count: ${hilo_count}`);
                    console.log('======================================');
                    callback(null, {
                        deck,
                        hilo_count,
                        uston_count,
                        user: {
                            money: 5000,
                            cards: [],
                            count: 0
                        },
                        to_add: {
                            hilo_count: 0,
                            uston_count: 0
                        },
                        table: {
                            cards: [],
                            count: 0
                        }
                    });
                });
            } else {
                var game = savedGame;
                game.to_add = {
                    uston_count: 0,
                    hilo_count: 0
                };
                console.log(`Starting Uston SS count: ${game.uston_count}`);
                console.log(`Starting Hi-Lo count: ${game.hilo_count}`);
                console.log('======================================');

                game.user.cards = [];
                game.table.cards = [];
                game.table.money = 0;
                game.user.count = 0;
                game.table.count = 0;
                callback(null, game);
            }
        },
        function selectBet(game, callback) {
            rl.question(`How much do you want to bet? (You have $${game.user.money},00): `, function(bet) {
                game.table.money = bet*2;
                game.user.money -= bet;
                callback(null, game);
            });
        },
        function giveCards(game, callback) {
            var userCards = [randomRange(0, game.deck.length-1), randomRange(0, game.deck.length-1)];
            //Protect against same cards in random
            while (userCards[0] === userCards[1]) {
                userCards[1] = randomRange(0, game.deck.length-1);
            }
            //Generating user cards
            for (var i = 0; i < userCards.length;i++)  {
                game.user.cards.push(game.deck[userCards[i]]);
                game.hilo_count += game.deck[userCards[i]].hilo;
                game.uston_count += game.deck[userCards[i]].uston;
                game.user.count += game.deck[userCards[i]].add_count;
                game.deck.splice(userCards[i], 1);
            }

            var tableCards = [randomRange(0, game.deck.length-1), randomRange(0, game.deck.length-1)];
            //Protect against same cards in random
            while (tableCards[0] === tableCards[1]) {
                tableCards[1] = randomRange(0, game.deck.length-1);
            }
            //Generating table cards
            for (var i = 0; i < tableCards.length;i++)  {
                game.table.cards.push(game.deck[tableCards[i]]);
                if (i === 0) {
                    game.hilo_count += game.deck[tableCards[i]].hilo;
                    game.uston_count += game.deck[tableCards[i]].uston;
                }
                game.table.count += game.deck[tableCards[i]].add_count;
                game.deck.splice(tableCards[i], 1);
            }

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

            callback(null, game);
        }
    ], function(err, game) {
        var restart = function(game_obj) {
            rl.question('R = Restart game / S = Shuffle remaining cards ', function(answer) {
                switch (answer) {
                    case 'S':
                        savedGame = game_obj;
                        beginGame();
                        break;
                    case 'R':
                        savedGame = null;
                        beginGame();
                        break;

                    default:
                        console.log('Unknown command.');
                        restart();
                        break;
                };
            });
        };
        var getCommand = function(c) {
            var handleCommands = function(command) {
                switch (command) {
                    case 'D':
                        game.user.money -= game.table.money/2;
                        game.table.money *= 2;
                        console.log(`You raised ${game.table.money/2}`);
                        handleCommands('H');
                        handleCommands('S');
                        break;
                    case 'SV':
                        fs.writeFile('game.json', JSON.stringify(game), function() {
                            console.log('Saved successfully!');
                            getCommand();
                        });
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
                        var new_card = randomRange(0, game.deck.length-1);
                        game.user.cards.push(game.deck[new_card]);
                        game.user.count += game.user.cards[game.user.cards.length-1].add_count;
                        game.hilo_count += game.user.cards[game.user.cards.length-1].hilo;
                        game.uston_count += game.user.cards[game.user.cards.length-1].uston;
                        game.deck.splice(new_card, 1);
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
                        if (game.user.count > 21) {
                            console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                            console.log('You lost!');
                            console.log('======================================');
                            restart(game);
                        }
                        else if (game.user.count == 21) {
                            game.user.money += game.table.money;
                            console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                            console.log('You won!');
                            console.log('======================================');
                            restart(game);
                        }
                        else getCommand();
                        break;
                    case 'S':
                        while   (game.table.count < 17 ||
                                (game.table.count > 10 && game.uston_count < 0 && game.hilo_count < 0))
                        {
                            var new_card = randomRange(0, game.deck.length-1);
                            game.table.cards.push(game.deck[new_card]);
                            game.table.count += game.table.cards[game.table.cards.length-1].add_count;
                            game.to_add.hilo_count += game.table.cards[game.table.cards.length-1].hilo;
                            game.to_add.uston_count += game.table.cards[game.table.cards.length-1].uston;
                            game.deck.splice(new_card, 1);
                        }
                        game.uston_count += game.to_add.uston_count;
                        game.hilo_count += game.to_add.hilo_count;

                        var table_cards = "";
                        for (var i = 0;i < game.table.cards;i++) {
                            table_cards = table_cards + game.table.cards[i].value + "/";
                        }
                        table_cards = table_cards.substr(0, table_cards.length-1);
                        if (game.table.count === game.user.count) {
                            console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                            game.user.money += game.table.money/2;
                            console.log(`It's a tie!`);
                            console.log('======================================');
                            restart(game);
                        }
                        else if (game.table.count > 21 || game.table.count < game.user.count) {
                            game.user.money += game.table.money;
                            console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                            console.log('You won!');
                            console.log('======================================');
                            restart(game);
                        } else if (game.table.count == 21 || game.table.count > game.user.count) {
                            console.log(`Table has ${table_cards}(${game.table.count}) and you have ${game.user.count}`);
                            console.log('You lost!');
                            console.log('======================================');
                            restart(game);
                        }
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