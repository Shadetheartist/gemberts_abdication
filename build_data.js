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

const BUG_TYPES = {
    worker: 'worker',
    smart: 'smart',
    strong: 'strong',
    flying: 'flying',
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
    [ACTIONS.draw_card]: 1.5,
    [ACTIONS.trash_card]: 1,
    [ACTIONS.explore]: 5,

    [BUG_TYPES.worker]: 0.5,
    [BUG_TYPES.smart]: 1,
    [BUG_TYPES.strong]: 1,
    [BUG_TYPES.flying]: 2,
}

function newResourceSet(data){
    const rs = {

        [BUG_TYPES.worker]: data?.worker ?? undefined,
        [BUG_TYPES.smart]: data?.smart ?? undefined,
        [BUG_TYPES.strong]: data?.strong ?? undefined,
        [BUG_TYPES.flying]: data?.flying ?? undefined,

        [ACTIONS.discard_card]: data?.discard_card ?? undefined,
        [ACTIONS.place_meeple]: data?.place_meeple ?? undefined,
        [ACTIONS.draw_card]: data?.draw_card ?? undefined,
        [ACTIONS.trash_card]: data?.trash_card ?? undefined,
        [ACTIONS.explore]: data?.explore ?? undefined,

        [RESOURCES.clay]: data?.clay ?? undefined,
        [RESOURCES.metal]: data?.metal ?? undefined,
        [RESOURCES.honey]: data?.honey ?? undefined,
        [RESOURCES.larvae]: data?.larvae ?? undefined,
        [RESOURCES.clarity]: data?.clarity ?? undefined,
    }

    return rs
}

function computeValue(object){
    let totalValue = 0
    
    // positive rewards
    for(const key in object.profits){
        const resouceValue = VALUES[key]
        const numResources = object.profits[key]
        totalValue += resouceValue * numResources
    }

    for(const key in object.bonus){
        const resouceValue = VALUES[key]
        const numResources = object.bonus[key]
        totalValue += resouceValue * numResources
    }

    // costs
    for(const key in object.cost){
        const resouceValue = VALUES[key]
        const numResources = object.cost[key]
        totalValue -= Math.abs(resouceValue * numResources)
    }

    for(const key in object.tax){
        const resouceValue = VALUES[key]
        const numResources = object.tax[key]
        totalValue -= Math.abs(resouceValue * numResources)
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
    '_production': '?',
    '_discard_card': '⏬',
    '_draw_card': '🃏',
    '_trash_card': '🗑️',
    '_worker': '⚒️',
    '_smart': '🧠',
    '_strong': '💪',
    '_flying': '🪶',
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

function resourcesSetStrings(resourceSet){
    const strings = []

    for(const key in resourceSet){
        const symbolKey = '_' + key
        const amount = resourceSet[key]
        for(let i = 0; i < amount; i++){
            strings.push(symbolKey)
        }
    }

    return strings
}

function resourcesSetString(resourceSet){
    const strings = resourcesSetStrings(resourceSet)

    if(strings.length < 1){
        return undefined
    }

    return strings.join(' ')
}


function newCard(data){
    const card = {
        object_id: newObjectId(),
        object_type: 'card',
        amount: data?.amount ?? 1,
        tier: data?.tier ?? 0,
        name: data?.name ?? "",
        card_text: data?.card_text ?? "",
        flavor_text: data?.flavor_text ?? "",
        production_power: data?.production_power ?? 0,
        combat_power: data?.combat_power ?? 0,
        cost: data?.cost ?? newResourceSet(),
        profits: data?.profits ?? newResourceSet(),
        types: data?.types ?? {},
    }

    card.value = computeValue(card)
    card.cost_str = resourcesSetString(card.cost)
    card.profits_str = resourcesSetString(card.profits)
    const types = resourcesSetStrings(card.types)
    if(types.length > 0){
        card.type_a = types[0] || undefined
    }
    
    if(types.length > 1){
        card.type_b = types[1] || undefined
    }

    return card
}

function newOnus(data){
    const onus = {
        object_id: newObjectId(),
        object_type: 'onus',
        amount: data?.amount ?? 1,
        tier: data?.tier ?? 0, 
        name: data?.name ?? "",
        flavor_text: data?.flavor_text ?? "",
        tax: data?.tax ?? newResourceSet(),
        bonus: data?.bonus ?? newResourceSet(),
    }

    onus.value = computeValue(onus)
    onus.tax_str = resourcesSetString(onus.tax)
    onus.bonus_str = resourcesSetString(onus.bonus)

    return onus
}

function newBuilding(data){
    const building = {
        object_id: newObjectId(),
        object_type: 'building',
        amount: data?.amount ?? 2,
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

    // tier 1 buildings get amount = 0 
    // because they're on the board
    newBuilding({
        name: "Mud Pit",
        tier: 1,
        amount: 0,
        flavor_text: "Muck about.",
        profits: newResourceSet({
            [RESOURCES.clay]: 2,
        }),
    }),

    newBuilding({
        name: "Mine",
        tier: 1,
        amount: 0,
        flavor_text: "Strike the Earth.",
        profits: newResourceSet({
            [RESOURCES.metal]: 1,
        }),
    }),

    newBuilding({
        // this is a great pollen making plant
        name: "Hellebore Field", 
        tier: 1,
        amount: 0,
        flavor_text: "Handsome Leaves.",
        profits: newResourceSet({
            [RESOURCES.honey]: 1,
        }),
    }),

    newBuilding({
        name: "Hatchery",
        tier: 1,
        amount: 0,
        flavor_text: "Little bug, little bug.",
        cost: newResourceSet({
            [ACTIONS.discard_card]: 1,
        }),
        profits: newResourceSet({
            [RESOURCES.larvae]: 1,
        }),
    }),


    // tier 2 -------

    newBuilding({
        name: "Orchid Field",
        tier: 2,
        flavor_text: "Soil to sustainence.",
        profits: newResourceSet({
            [RESOURCES.clay]: 1,
            [RESOURCES.honey]: 1,
        }),
    }),

    newBuilding({
        name: "Materials",
        tier: 2,
        flavor_text: "Creation arrives!",
        profits: newResourceSet({
            [RESOURCES.clay]: 1,
            [RESOURCES.metal]: 1,
        }),
    }),

    newBuilding({
        name: "Incubator",
        tier: 2,
        flavor_text: "Bigger bug, medium bug.",
        profits: newResourceSet({
            [RESOURCES.larvae]: 1,
        }),
    }),

    newBuilding({
        name: "Rich Soil",
        tier: 2,
        flavor_text: "Loam is love.",
        profits: newResourceSet({
            [RESOURCES.clay]: 3,
        }),
    }),

    newBuilding({
        name: "Town Square",
        tier: 2,
        flavor_text: "Hustle n Bustle.",
        profits: newResourceSet({
            [ACTIONS.draw_card]: 2,
        }),
    }),

    newBuilding({
        name: "Workshop",
        tier: 2,
        flavor_text: "*Clank Clank*",
        cost: newResourceSet({
            [ACTIONS.discard_card]: 1,
        }),
        profits: newResourceSet({
            [RESOURCES.metal]: 2,
        }),
    }),

    newBuilding({
        name: "Jelly Juicer",
        tier: 2,
        flavor_text: "It's juicy jelly.",
        cost: newResourceSet({
            [ACTIONS.discard_card]: 1,
        }),
        profits: newResourceSet({
            [RESOURCES.honey]: 2,
        }),
    }),

    newBuilding({
        name: "Lunch Room",
        tier: 2,
        flavor_text: "Jellied Rust AGAIN?",
        cost: newResourceSet({
            [ACTIONS.discard_card]: 1,
        }),
        profits: newResourceSet({
            [RESOURCES.honey]: 1,
            [RESOURCES.metal]: 1,
        }),
    }),


    // tier 3 -------

    newBuilding({
        name: "Richer Soil",
        tier: 3,
        flavor_text: "Loam is life.",
        profits: newResourceSet({
            [RESOURCES.clay]: 4,
        }),
    }),

    newBuilding({
        name: "Bionic Lab",
        tier: 3,
        amount: 1,
        flavor_text: "Moist and sterile.",
        profits: newResourceSet({
            [RESOURCES.metal]: 1,
            [RESOURCES.larvae]: 1,
        }),
    }),

    newBuilding({
        name: "Brothel",
        tier: 3,
        flavor_text: "Rumor and scandals.",
        profits: newResourceSet({
            [RESOURCES.honey]: 1,
            [RESOURCES.larvae]: 1,
        }),
    }),

    newBuilding({
        name: "Morzoth's Nest",
        tier: 3,
        amount: 1,
        flavor_text: "*Not Morgoth",
        profits: newResourceSet({
            [RESOURCES.clay]: 2,
            [RESOURCES.larvae]: 1,
        }),
    }),

    newBuilding({
        name: "Plaza",
        tier: 3,
        amount: 1,
        flavor_text: "Heaps of hustle.",
        profits: newResourceSet({
            [ACTIONS.draw_card]: 3,
        }),
    }),

    newBuilding({
        name: "The Exchange",
        tier: 3,
        flavor_text: "Gather what ye may.",
        profits: newResourceSet({
            [RESOURCES.clay]: 1,
            [RESOURCES.honey]: 1,
            [RESOURCES.metal]: 1,
        }),
    }),

]

const cardData = [
    newCard({
        name: "Small Man",
        amount: 8,
        card_text: "",
        flavor_text: "Pathetic, unremarkable.",
        types: {
            [BUG_TYPES.worker]: 1
        },
    }),
    newCard({
        name: "Police",
        amount: 4,
        card_text: "",
        flavor_text: "Don't even think of breakening the law!",
        types: {
            [BUG_TYPES.strong]: 1
        },
    }),
    newCard({
        name: "Noble Flappe",
        amount: 3,
        card_text: "",
        flavor_text: "",
        types: {
            [BUG_TYPES.smart]: 1,
            [BUG_TYPES.flying]: 1,
        },
    }),
    newCard({
        name: "Gembert's Apostle",
        amount: 2,
        card_text: "",
        flavor_text: "",
        types: {
            [BUG_TYPES.worker]: 1,
            [BUG_TYPES.smart]: 1,
        },
    }),
]

const onusData = [
    newOnus({
        name: "Collapsed Wall",
        flavor_text: "",
        tax: newResourceSet({
            [BUG_TYPES.worker]: 1,
            [RESOURCES.clay]: 1,
            [RESOURCES.metal]: 1,
        }),
        bonus: newResourceSet({
            [BUG_TYPES.strong]: 1,
        }),
    }),
    newOnus({
        name: "Rusted Machinery",
        flavor_text: "",
        tax: newResourceSet({
            [BUG_TYPES.worker]: 1,
            [RESOURCES.metal]: 2,
        }),
        bonus: newResourceSet({
            [ACTIONS.trash_card]: 1,
        }),
    }),
    newOnus({
        name: "Unbloodied Altar",
        flavor_text: "",
        tax: newResourceSet({
            [BUG_TYPES.smart]: 1,
            [RESOURCES.larvae]: 1,
        }),
        bonus: newResourceSet({
            [ACTIONS.draw_card]: 1,
        }),
    }),
    newOnus({
        name: "Bureaucrats",
        flavor_text: "",
        tax: newResourceSet({
            [BUG_TYPES.worker]: 2,
            [RESOURCES.honey]: 1,
        }),
        bonus: newResourceSet({
            [BUG_TYPES.smart]: 1,
        }),
    }),
    newOnus({
        name: "Broken Fridge",
        flavor_text: "",
        tax: newResourceSet({
            [RESOURCES.honey]: 1,
            [RESOURCES.metal]: 1,
        }),
        bonus: newResourceSet({
            [BUG_TYPES.worker]: 1,
        }),
    }),
]


fs.writeFile('data/card_data.json', symbolReplace(JSON.stringify(cardData, null, 4)), 'utf8', (err) => { 
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file card_data.json") 
})

fs.writeFile('data/building_data.json', symbolReplace(JSON.stringify(buildingData, null, 4)), 'utf8', (err) => {
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file building_data.json") 
})

fs.writeFile('data/onus_data.json', symbolReplace(JSON.stringify(onusData, null, 4)), 'utf8', (err) => {
    if (err !== null) {
        console.log(err)
        return
    }
    console.log("created card data file onus_data.json") 
})
