export function Farmer (name, items) {
    let self = {
        name: name,
        items: items
    }
    return self
}

export function Food (name, group, description, quantity, price, taste, nutrition) {
    let self = {
        name: name,
        group: group,
        description: description,
        quantity: quantity,
        price: price,
        taste: taste,
        nutrition: nutrition
    }
    return self
}