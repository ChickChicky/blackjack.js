module.exports = {

    card_obj: function(rank,suit) { 
        return { rank,suit,
            repr: `${rank}${suit}`,
            ansi: `\x1b[${['♠','♣'].includes(suit)?30:31}m${rank}${suit}\x1b[m`,
            color: ['♠','♣'].includes(suit)?'black':'red'
        }
    },

    random: function() {

        let ranks = [
            'A',2,3,4,5,6,7,8,9,10,'J','Q','K'
        ]

        let suits = [
            '♣','♦','♥','♠'
        ]

        let rank = ranks[Math.floor(Math.random()*ranks.length)];
        let suit = suits[Math.floor(Math.random()*suits.length)];

        return this.card_obj(rank,suit);

    },

    stack: function(randomized=true) {

        let ranks = [
            'A',2,3,4,5,6,7,8,9,10,'J','Q','K'
        ]

        let suits = [
            '♣','♦','♥','♠'
        ]

        let cards = [];

        for (let suit of suits) 
        for (let rank of ranks) 
            cards.push(this.card_obj(rank,suit));

        if (randomized) cards.sort(()=>Math.random()-.5);

        return cards;

    },

}