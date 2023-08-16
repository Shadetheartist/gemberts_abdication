const { log } = require('console')
const fs = require('fs')


const RESOURCES = {
    clay: 'clay',
    metal: 'metal',
    honey: 'honey',
    larvae: 'larvae',
    clarity: 'clarity',
}

const ACTIONS = {
    place_meeple: 'place_meeple',
    discard_card: 'discard_card',
    draw_card: 'draw_card',
    trash_card: 'trash_card',
    explore: 'explore',
}

// try to evaluate various actions and resources to a 
// generalized value to help with game balance
// trying to stick to a set of numbers from fibonnacci seq
const VALUES = {
    [RESOURCES.clay]: 1,
    [RESOURCES.metal]: 2,
    [RESOURCES.honey]: 2,
    [RESOURCES.larvae]: 3,
    [RESOURCES.clarity]: 5,

    [ACTIONS.discard_card]: 1,
    [ACTIONS.place_meeple]: -2, // minus because this gains resources
    [ACTIONS.draw_card]: 2,
    [ACTIONS.trash_card]: 2,
    [ACTIONS.explore]: 5,
}

function newResourceSet(data){
    const rs = {
        [RESOURCES.clay]: data.clay ?? 0,
        [RESOURCES.metal]: data.metal ?? 0,
        [RESOURCES.honey]: data.honey ?? 0,
        [RESOURCES.larvae]: data.larvae ?? 0,
        [RESOURCES.clarity]: data.clarity ?? 0,
        
        [ACTIONS.discard_card]: data.discard_card ?? 0,
        [ACTIONS.place_meeple]: data.place_meeple ?? 0,
        [ACTIONS.draw_card]: data.draw_card ?? 0,
        [ACTIONS.trash_card]: data.trash_card ?? 0,
        [ACTIONS.explore]: data.explore ?? 0,
    }

    // tack on the computed value as it could be useful for balancing
    rs.value = computeValue(rs)

    return rs
}

function computeValue(resourceSet){
    let totalValue = 0
    
    for(const key in resourceSet){
        const resouceValue = VALUES[key]
        const numResources = resourceSet[key]
        totalValue += resouceValue * numResources
    }

    return totalValue
}



const SYMBOL_MAP = {
    '_honey': '🍯',
    '_clay': '🪨',
    '_metal': '💿',
    '_clarity': '✨',
    '_larvae': '🐛',
    '_defence': '🛡',
    '_combatpower': '⚔️',
    '_production': '⚒️',
    '_x': '×',
    '_d1': "⚀",
    '_d2': "⚁",
    '_d3': "⚂",
    '_d4': "⚃",
    '_d5': "⚄",
    '_d6': "⚅",
}

let objectId = 1
function newObjectId(){
    const val = objectId
    objectId++
    return val
}

function symbolReplace(str){
    for (const s in SYMBOL_MAP) {
        str = str.replaceAll(s, SYMBOL_MAP[s])
    }
    
    return str
}


function newCard(data){
    return {
        objectId: newObjectId(),
        type: 'card',
        tier: data.tier ?? 1,
        name: data.name,
        card_text: data.card_text,
        flavor_text: data.flavor_text,
        production_power: data.production_power,
        combat_power: data.combat_power,
        cost: data.cost
    }
}

function newOnus(data){
    return {
        objectId: newObjectId(),
        type: 'onus',
        // tier can indicate the cost this should target. 
        // If the tier and the resource value are out of line 
        // then a warning can be generated to aid in balance
        tier: data.tier ?? 1, 
        name: data.name,
        flavor_text: data.flavor_text,
        cost: data.cost
    }
}

function newBuilding(data){
    return {
        objectId: newObjectId(),
        type: 'building',
        tier: data.tier ?? 0,
        name: data.name,
        card_text: data.card_text,
        flavor_text: data.flavor_text,
        defence: data.defence,
        cost: data.cost,
        profits: data.profits ?? {}
    }
}

const buildingData = [

    newBuilding({
        name: "Mud Pit",
        tier: 1,
        flavor_text: "Muck about.",
        profits: newResourceSet({
            [RESOURCES.clay]: 2,
        }),
    }),

    newBuilding({
        name: "Mine",
        tier: 1,
        flavor_text: "Strike the Earth.",
        profits: newResourceSet({
            [RESOURCES.metal]: 1,
        }),
    }),

    newBuilding({
        // this is a great pollen making plant
        name: "Hellebore Field", 
        tier: 1,
        flavor_text: "Strike the Earth.",
        profits: newResourceSet({
            [RESOURCES.honey]: 1,
        }),
    }),

    newBuilding({
        name: "Hatchery",
        tier: 1,
        flavor_text: "Little bug, little bug.",
        cost: newResourceSet({
            [ACTIONS.discard_card]: 1,
        }),
        profits: newResourceSet({
            [RESOURCES.larvae]: 1,
        }),
    }),
]

const cardData = [
    newCard({
        name: "Small Man",
        card_text: "",
        flavor_text: "Pathetic, unremarkable.",
        production_power: 2,
        combat_power: 1,
        cost: {
            larvae: 1
        }
    }),
    newCard({
        name: "Nest Tender",
        card_text: "+1_combatpower when defending.\n+1_larvae when producing _larvae.",
        flavor_text: "My children are meant for more.",
        production_power: 1,
        combat_power: 0,
        cost: {
            larvae: 1,
            honey: 1
        }
    }),
    newCard({
        name: "Worm",
        card_text: "+1_clay when producing _clay",
        flavor_text: "Loam is love, loam is life.",
        production_power: 1,
        combat_power: 0,
        cost: {
            larvae: 1
        }
    }),
    newCard({
        name: "Wasp",
        card_text: "Sacrifice an unplayed bug: add it's stats to this until end of turn.",
        flavor_text: "STRIKE! STRIKE! STRIKE!",
        production_power: 1,
        combat_power: 2,
        cost: {
            larvae: 1,
            clay: 1,
            honey: 1
        }
    }),
    newCard({
        name: "Dragonfly",
        card_text: "Kill weakest defender: +1_honey.",
        flavor_text: "Loam is love, loam is life.",
        production_power: 0,
        combat_power: 3,
        cost: {
            larvae: 1,
            clay: 2,
            honey: 2
        }
    }),
    newCard({
        name: "Police",
        card_text: "+1_combatpower when defending.",
        flavor_text: "Don't even think of breakening the law!",
        production_power: 1,
        combat_power: 2,
        cost: {
            larvae: 1,
            clay: 2
        }
    }),
    newCard({
        name: "Flying Man",
        card_text: "Choose the raided resource when raiding with this.",
        flavor_text: "I see what you have, and what you are.",
        production_power: 2,
        combat_power: 2,
        cost: {
            larvae: 1,
            clay: 2,
            honey: 1
        }
    }),
    newCard({
        name: "Lady Bug",
        card_text: "Roll a die:\n_d1_d2_d3: +1_clay.\n_d4_d5: +1_honey.\n_d6: +1_larvae.",
        flavor_text: "",
        production_power: 1,
        combat_power: 1,
        cost: {
            larvae: 1,
            honey: 2
        }
    }),
    newCard({
        name: "Worker Bee",
        card_text: "+1_honey when producing honey.",
        flavor_text: "",
        production_power: 1,
        combat_power: 1,
        cost: {
            larvae: 1,
            honey: 2
        }
    }),
]


const onusData = [
    newOnus({
        name: "Collapsed Wall",
        flavor_text: "",
        cost: newResourceSet({
            [RESOURCES.clay]: 2,
            [RESOURCES.metal]: 1,
        }),
    }),
    newOnus({
        name: "Rusted Machinery",
        flavor_text: "",
        cost: newResourceSet({
            [RESOURCES.metal]: 2,
        }),
    }),
    newOnus({
        name: "Unbloodied Altar",
        flavor_text: "",
        cost: newResourceSet({
            [RESOURCES.larvae]: 1,
        }),
    }),
    newOnus({
        name: "Greedy Bureaucrats",
        flavor_text: "",
        cost: newResourceSet({
            [RESOURCES.honey]: 2,
        }),
    }),
    
]

fs.writeFile('data/card_data.json', symbolReplace(JSON.stringify(cardData)), 'utf8', (err) => { 
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file card_data.json") 
})

fs.writeFile('data/building_data.json', symbolReplace(JSON.stringify(buildingData)), 'utf8', (err) => {
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file building_data.json") 
})
