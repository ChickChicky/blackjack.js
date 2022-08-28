// useful stuff

const card = require('./card');
const input = require('./inputReader');

const val = function(card) {
    if (Array.isArray(card)) {

        let aces = card.filter( c=>c.rank=='A' );
        let cards = card.filter( c=>c.rank!='A' );

        if (aces.length) {
            let i = 0;
            let comb = [];
            while (i < 2**aces.length) {
                let a = 0;
                for (let j = 0; j<aces.length; j++) {
                    //console.log(`j: ${j} ${2**j} ${(i&(2**j)) != 0}`);
                    if (i&(2**j) != 0) a++;
                }
                //console.log(`a: ${a}`);
                comb.push(val(cards)[0]+a*11+(aces.length-a));
                i++;
            }
            return comb;
        } else {
            return [ cards.map(c=>val(c)).reduce( (p,v)=>p+v ,0 ) ];
        }

    } else {

        let c = typeof card == 'string'?card:card.repr;

        return {
            'A':  11,
            '2':  2,
            '3':  3,
            '4':  4,
            '5':  5,
            '6':  6,
            '7':  7,
            '8':  8,
            '9':  9,
            '10': 10,
            'Q':  10, 'K': 10, 'J': 10,
        }[c.slice(0,-1)];

    }
}

const sleep = function(ms) {
    return new Promise( r=>setTimeout(r,ms) );
}

// players

let dealer = {
    cards: [],
    visible_cards: []
}

let player = {
    cards: [],
    tokens: 100,
    fake_cards: 0
}

// code

function display(player,dealer,bet) {
console.log(`\x1b[0;0H\x1b[2J\
\
Dealer ${val(dealer.visible_cards).sort((a,b)=>a==Math.max(...val(dealer.visible_cards).filter(c=>c<22))?-1:a-b).map(v=>v==Math.max(...val(dealer.visible_cards).filter(c=>c<22))?`\x1b[33;4m${v}\x1b[m`:`\x1b[33;2m${v}\x1b[m`).join(',')}:
${dealer.visible_cards.map(c=>c.ansi).join(' ')}${dealer.visible_cards.length?' ':''}\x1b[30m${'## '.repeat(dealer.cards.length-dealer.visible_cards.length)}\x1b[m

Player ${val(player.cards).sort((a,b)=>a==Math.max(...val(player.cards).filter(c=>c<22))?-1:a-b).map(v=>v==Math.max(...val(player.cards).filter(c=>c<22))?`\x1b[33;4m${v}\x1b[m`:`\x1b[33;2m${v}\x1b[m`).join(',')}:
${player.cards.map(c=>c.ansi).join(' ')}${player.cards.length?' ':''}\x1b[30m${'## '.repeat(player.fake_cards)}\x1b[m
`);
}

(async()=>{

    // while (true) {
    //     let c = card.random();
    //     if (c.rank == 'A') {
    //         console.log(c.ansi);
    //         console.log(val([c]));
    //         console.log();
    //         let nc = card.random();
    //         console.log(c.ansi,nc.ansi);
    //         console.log(val([c,nc]));
    //         console.log('\n');
    //         await sleep(1000000);
    //     }
    // }

    while (true) {

        console.log(`\x1b[2J`);
        console.log(`\x1b[1;1HYour balance: \x1b[36m${player.tokens}\x1b[m`);

        if (player.tokens == 0) {
            console.log(`\n\x1b[31;1mYou lost\x1b[m`);
            break;
        }

        let bet;
        while (true) { 
            bet = await input('\x1b[2;1H\x1b[2K\x1b[mYour bet: ',{type:'text'});
            let bn = Number(bet);
            if ( bn != Math.floor(bn) || bn > player.tokens ) {
                console.log(`\x1b[31mInvalid value\x1b[m`);
            } else {
                bet = bn;
                break;
            }
        }

        let bj = false;
        let dis = ()=>{display(player,dealer,bet);if(bj)console.log(`\x1b[30mBlackjack !\x1b[m`)}

        player.tokens -= bet;

        let stack = card.stack(true);

        dealer.cards = [];
        dealer.visible_cards = [];
        player.cards = [];

        dis();
        await sleep(250);
        dealer.cards.push(stack.pop());
        dis();
        await sleep(250);
        dealer.cards.push(stack.pop());
        dis()
        await sleep(250);
        dealer.visible_cards = [dealer.cards[0]];
        dis()

        await sleep(1000);

        player.cards.push(stack.pop());
        dis();
        await sleep(250);
        player.cards.push(stack.pop());
        if (val(player.cards).includes(21))
            bj = true;
        dis()

        await sleep(1000);

        while (true) {

            dis();
            let act;
            if (!bj) act = await input( 'Choose an action', {type:'choices',choices:[`Stand`,...val(player.cards).includes(21)?[]:[`Hit`]]} );

            if (act == 'Stand' || bj) {
                dealer.visible_cards = dealer.cards;
                dis();
                await sleep(500);
                while (Math.min(...val(dealer.cards)) < 17) {
                    dealer.cards.push(stack.pop());
                    dis();
                    await sleep(250);
                }
                //console.log(`Player:\nValue(s): ${val(player.cards)}\nBest: ${Math.max(...val(player.cards).filter(c=>c<22))}\n\nDealer:\nValue(s): ${val(dealer.cards)}\nBest: ${Math.max(...val(dealer.cards).filter(c=>c<222))}`);
                //await input('<PAUSE>',{type:'text'});
                if ( Math.min(...val(dealer.cards)) >21 || Math.max(...val(dealer.cards).filter(c=>c<22)) < Math.max(...val(player.cards).filter(c=>c<22)) ) { // Win
                    player.tokens += Math.floor(bet*(bj?3.5:2));
                    console.log(`\x1b[32;1mYou win\x1b[m \x1b[32m+${bet*(bj?2.5:1)}\x1b[m\n -> \x1b[36m${player.tokens}\x1b[m\n\n${Math.min(...val(dealer.cards))>21?`\x1b[34mdealer busted\x1b[m`:``}`);
                    await sleep(4000);
                    break;
                } else if ( Math.max(...val(dealer.cards).filter(c=>c<22)) == Math.max(...val(player.cards).filter(c=>c<22)) ) { // Push
                    player.tokens += bet;
                    console.log(`\x1b[35;1mPush\x1b[m \x1b[35m~${0}\x1b[m\n -> \x1b[36m${player.tokens}\x1b[m`);
                    await sleep(4000);
                    break; 
                } else { // Bust
                    console.log(`\x1b[31;1mBusted\x1b[m \x1b[31m-${bet}\x1b[m\n -> \x1b[36m${player.tokens}\x1b[m`);
                    await sleep(4000);
                    break; 
                }
            } else if (act == 'Hit') {
                player.fake_cards++;
                dis();
                await sleep(250);
                player.cards.push(stack.pop());
                player.fake_cards--;
                dis();
                await sleep(100);

                if ( Math.min(...val(player.cards)) >21 ) {
                    console.log(`\x1b[31;1mBusted\x1b[m \x1b[31m-${bet}\x1b[m\n -> \x1b[36m${player.tokens}\x1b[m`);
                    await sleep(4000);
                    break;
                }
            }

        }
    }

})();