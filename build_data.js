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

    // minus because this gains resources
    [ACTIONS.discard_card]: -1,
    [ACTIONS.place_meeple]: -2, 
    [ACTIONS.draw_card]: 2,
    [ACTIONS.trash_card]: 2,
    [ACTIONS.explore]: 5,
}

function newResourceSet(data){
    const rs = {
        [RESOURCES.clay]: data?.clay ?? 0,
        [RESOURCES.metal]: data?.metal ?? 0,
        [RESOURCES.honey]: data?.honey ?? 0,
        [RESOURCES.larvae]: data?.larvae ?? 0,
        [RESOURCES.clarity]: data?.clarity ?? 0,
        
        [ACTIONS.discard_card]: data?.discard_card ?? 0,
        [ACTIONS.place_meeple]: data?.place_meeple ?? 0,
        [ACTIONS.draw_card]: data?.draw_card ?? 0,
        [ACTIONS.trash_card]: data?.trash_card ?? 0,
        [ACTIONS.explore]: data?.explore ?? 0,
    }

    return rs
}

function computeValue(object){
    let totalValue = 0
    
    for(const key in object.profits){
        const resouceValue = VALUES[key]
        const numResources = object.profits[key]
        totalValue += resouceValue * numResources
    }

    for(const key in object.cost){
        const resouceValue = VALUES[key]
        const numResources = object.cost[key]
        totalValue -= resouceValue * numResources
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
    '_discard_card': '⏬',
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

function resourcesSetString(resourceSet){
    const strings = []

    for(const key in resourceSet){
        const symbolKey = '_' + key
        const amount = resourceSet[key]
        for(let i = 0; i < amount; i++){
            strings.push(symbolKey)
        }
    }

    if(strings.length < 1){
        return null
    }

    return strings.join(' ')
}


function newCard(data){
    const card = {
        objectId: newObjectId(),
        type: 'card',
        tier: data?.tier ?? 0,
        name: data?.name ?? "",
        card_text: data?.card_text ?? "",
        flavor_text: data?.flavor_text ?? "",
        production_power: data?.production_power ?? 0,
        combat_power: data?.combat_power ?? 0,
        cost: data?.cost ?? newResourceSet(),
        profits: data?.profits ?? newResourceSet(),
    }

    card.value = computeValue(card)
    card.cost_str = resourcesSetString(card.cost)
    card.profits_str = resourcesSetString(card.profits)

    return card
}

function newOnus(data){
    const onus = {
        objectId: newObjectId(),
        type: 'onus',
        // tier can indicate the cost this should target. 
        // If the tier and the resource value are out of line 
        // then a warning can be generated to aid in balance
        tier: data?.tier ?? 0, 
        name: data?.name ?? "",
        flavor_text: data?.flavor_text ?? "",
        cost: data?.cost ?? newResourceSet(),
        profits: data?.profits ?? newResourceSet(),
    }

    onus.value = computeValue(onus)
    onus.cost_str = resourcesSetString(onus.cost)
    onus.profits_str = resourcesSetString(onus.profits)

    return onus
}

function newBuilding(data){
    const building = {
        objectId: newObjectId(),
        type: 'building',
        tier: data?.tier ?? 0,
        name: data?.name ?? "",
        card_text: data?.card_text ?? "",
        flavor_text: data?.flavor_text ?? "",
        defence: data?.defence ?? 0,
        cost: data?.cost ?? newResourceSet(),
        profits: data?.profits ?? newResourceSet(),
    }

    building.value = computeValue(building)
    building.cost_str = resourcesSetString(building.cost)
    building.profits_str = resourcesSetString(building.profits)

    building.outcome_str = building.profits_str
    if (building.cost_str){
        building.outcome_str = building.cost_str + "▶" + building.profits_str
    }

    return building
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
        flavor_text: "Handsome Leaves.",
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
