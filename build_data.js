const { log } = require('console')
const fs = require('fs')

let objectId = 1

function newCard(data){
    const card = {
        objectId: objectId,
        tier: data.tier,
        name: data.name,
        card_text: data.card_text,
        flavor_text: data.flavor_text,
        defence: data.defence,
        cost: data.cost
    }

    objectId += 1

    return card
}

function newBuilding(data){
    const card = {
        objectId: objectId,
        tier: data.tier,
        name: data.name,
        card_text: data.card_text,
        flavor_text: data.flavor_text,
        defence: data.defence,
        cost: data.cost
    }

    objectId += 1

    return card
}

const buildingData = [
    newBuilding({
        "name": "Shrine",
        "card_text": "+1 hand size.\n_honey_x1: Draw,discard.",
        "flavor_text": "Instability underpins all.",
        "defence": 2,
        "cost": {
            "production": 2,
            "clay": 2,
            "honey": 1,
            "larvae": 1
        }
    }),
    newBuilding({
        "name": "Larvae Chambers",
        "card_text": "_production_x3: _larvae_x1.",
        "flavor_text": "Fresh chitin for our Lord.",
        "defence": 2,
        "cost": {
            "production": 2,
            "clay": 2
        }
    }),
    newBuilding({
        "name": "Bee Hive",
        "card_text": "_production_x2: _honey_x1.",
        "flavor_text": "Sweeting bites for later.",
        "defence": 1,
        "cost": {
            "production": 2,
            "larvae": 2
        }
    }),
    newBuilding({
        "name": "Mud Pit",
        "card_text": "_production_x1: _clay_x1.",
        "flavor_text": "Muck about.",
        "defence": 1,
        "cost": {
            "production": 4
        }
    }),
    newBuilding({
        "name": "Embassy",
        "card_text": "_production_x2: Swap a card in your market with any other market.",
        "flavor_text": "Diplomatic relations are good, for now.",
        "defence": 3,
        "cost": {
            "production": 4,
            "clay": 2,
            "honey": 3
        }
    }),
    newBuilding({
        "name": "Administration",
        "card_text": "_production costs for buildings directly under this are reduced by 1 (not below _production_x1).",
        "flavor_text": "Efficiency is key.",
        "defence": 2,
        "cost": {
            "production": 4,
            "clay": 4,
            "honey": 3
        }
    }),
    newBuilding({
        "name": "Market",
        "card_text": "+2 Market Slots.\n_production_x2, _honey_x1: Swap a card in your market with the central market.",
        "flavor_text": "Efficiency is key.",
        "defence": 2,
        "cost": {
            "production": 4,
            "clay": 3,
            "honey": 1
        }
    }),
    newBuilding({
        "name": "Palace",
        "card_text": "+1_defence for buildings under this.\n+1_combatpower, +1_production for all your bugs.",
        "flavor_text": "Efficiency is key.",
        "defence": 2,
        "cost": {
            "production": 4,
            "clay": 3,
            "honey": 1
        }
    }),
    newBuilding({
        "name": "Pantheon",
        "card_text": "+1 Hand Size\n_production_x2: Draw a card.",
        "flavor_text": "Let him know your love.",
        "defence": 2,
        "cost": {
            "production": 6,
            "clay": 4,
            "honey": 3
        }
    }),
    newBuilding({
        "name": "Wasp Altar",
        "card_text": "_production_x2, sacrifice an unplayed bug: Reveal the top card of the central market, you may use it's abilities this turn.",
        "flavor_text": "SPIKE! SPIKE! SPIKE!",
        "defence": 2,
        "cost": {
            "production": 2,
            "clay": 2,
            "honey": 1
        }
    }),
    newBuilding({
        "name": "Lady's Abode",
        "card_text": "Roll a Die:\n_d1 _d2: _clay_x2\n_d3 _d4: _honey_x1\n_d5 _d6: _larvae_x1",
        "flavor_text": "Lovely.",
        "defence": 3,
        "cost": {
            "production": 4,
            "clay": 6,
            "honey": 4,
            "larvae": 1
        }
    }),
    newBuilding({
        "name": "Factory",
        "card_text": "_x2 yield for _clay and _honey from buildings under this.",
        "flavor_text": "Gyokai!",
        "defence": 2,
        "cost": {
            "production": 6,
            "clay": 6,
            "honey": 4
        }
    }),
]

const cardData = [
    newCard({
        "name": "Small Man",
        "card_text": "",
        "flavor_text": "Pathetic, unremarkable.",
        "production_power": 2,
        "combat_power": 1,
        "cost": {
            "larvae": 1
        }
    }),
    newCard({
        "name": "Nest Tender",
        "card_text": "+1_combatpower when defending.\n+1_larvae when producing _larvae.",
        "flavor_text": "My children are meant for more.",
        "production_power": 1,
        "combat_power": 0,
        "cost": {
            "larvae": 1,
            "honey": 1
        }
    }),
    newCard({
        "name": "Worm",
        "card_text": "+1_clay when producing _clay",
        "flavor_text": "Loam is love, loam is life.",
        "production_power": 1,
        "combat_power": 0,
        "cost": {
            "larvae": 1
        }
    }),
    newCard({
        "name": "Wasp",
        "card_text": "Sacrifice an unplayed bug: add it's stats to this until end of turn.",
        "flavor_text": "STRIKE! STRIKE! STRIKE!",
        "production_power": 1,
        "combat_power": 2,
        "cost": {
            "larvae": 1,
            "clay": 1,
            "honey": 1
        }
    }),
    newCard({
        "name": "Dragonfly",
        "card_text": "Kill weakest defender: +1_honey.",
        "flavor_text": "Loam is love, loam is life.",
        "production_power": 0,
        "combat_power": 3,
        "cost": {
            "larvae": 1,
            "clay": 2,
            "honey": 2
        }
    }),
    newCard({
        "name": "Police",
        "card_text": "+1_combatpower when defending.",
        "flavor_text": "Don't even think of breakening the law!",
        "production_power": 1,
        "combat_power": 2,
        "cost": {
            "larvae": 1,
            "clay": 2
        }
    }),
    newCard({
        "name": "Flying Man",
        "card_text": "Choose the raided resource when raiding with this.",
        "flavor_text": "I see what you have, and what you are.",
        "production_power": 2,
        "combat_power": 2,
        "cost": {
            "larvae": 1,
            "clay": 2,
            "honey": 1
        }
    }),
    newCard({
        "name": "Lady Bug",
        "card_text": "Roll a die:\n_d1_d2_d3: +1_clay.\n_d4_d5: +1_honey.\n_d6: +1_larvae.",
        "flavor_text": "",
        "production_power": 1,
        "combat_power": 1,
        "cost": {
            "larvae": 1,
            "honey": 2
        }
    }),
    newCard({
        "name": "Worker Bee",
        "card_text": "+1_honey when producing honey.",
        "flavor_text": "",
        "production_power": 1,
        "combat_power": 1,
        "cost": {
            "larvae": 1,
            "honey": 2
        }
    }),
]

fs.writeFile('data/card_data.json', JSON.stringify(cardData), 'utf8', (err) => { 
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file card_data.json") 
})

fs.writeFile('data/building_data.json', JSON.stringify(buildingData), 'utf8', (err) => {
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file building_data.json") 
})
