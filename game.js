var fs = require('fs');

var Game = {};

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

Game.generateDeck = function(deck_count) {
    var deck = [];
    for (var i = 0;i < deck_count;i++) {
        for (var j = 0;j < cards.length;j++) {
            deck.push(cards[j]);
        }
    }
    var uston_count = deck_count * -2;
    var hilo_count = 0;
    Game.instance = {
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
            count: 0,
            money: 0
        }
    };
    return Game.instance;
};

Game.saveGame = function(path) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, JSON.stringify(Game.instance), function(err) {
            if (err) reject(err);
            else resolve(JSON.stringify(Game.instance));
        });
    });
};

Game.saveGameSync = function(path) {
    fs.writeFileSync(path, JSON.stringify(Game.instance));
    resolve(JSON.stringify(Game.instance));
};

Game.bet = function(money) {
    Game.instance.user.money -= money;
    Game.instance.table.money += money*2;
    return Game.instance;
};

Game.giveCards = function() {
    var game = Game.instance;
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

        return game;
    }
};

Game.hit = function() {
    var game = Game.instance;
    var new_card = randomRange(0, game.deck.length-1);
    game.user.cards.push(game.deck[new_card]);
    game.user.count += game.user.cards[game.user.cards.length-1].add_count;
    game.hilo_count += game.user.cards[game.user.cards.length-1].hilo;
    game.uston_count += game.user.cards[game.user.cards.length-1].uston;
    game.deck.splice(new_card, 1);
    return Game.checkEnd(false);
};

Game.checkEnd = function(stand) {
    var game = Game.instance;
    if (game.user.count === 21 || (game.user.count > game.table.count && stand) || game.table.count > 21) {
        game.user.money += game.table.money;
        return {
            winner: 'player'
        };
    } else if (game.user.count > 21 || (game.user.count < game.table.count && stand) || game.table.count === 21) {
        return {
            winner: 'computer'
        };
    } else {
        game.user.money += game.table.money/2;
        return { winner: null };
    };
};

Game.stand = function() {
    var game = Game.instance;
    while   (game.table.count < 17 ||
    (game.table.count > 10 && game.uston_count < 0 && game.hilo_count < 0))
    {
        var new_card = randomRange(0, game.deck.length-1);
        game.table.cards.push(game.deck[new_card]);
        game.table.count += game.table.cards[game.table.cards.length-1].add_count;
        game.hilo_count += game.table.cards[game.table.cards.length-1].hilo;
        game.uston_count += game.table.cards[game.table.cards.length-1].uston;
        game.deck.splice(new_card, 1);
    }
    return Game.checkEnd(true);
};

Game.double = function() {
    var game = Game.instance;
    var raised = game.table.money/2;
    Game.bet(raised);
    Game.hit();
    return {
        result: Game.stand(),
        raised
    };
};

module.exports = Game;