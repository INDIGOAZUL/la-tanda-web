/**
 * Honduras Lottery Signs/Animals Mapping
 * La Diaria - 00-99 to Animal Names
 */

const LOTTERY_SIGNS = {
    0: "Avión", 1: "Pies", 2: "Mujer", 3: "Muerto", 4: "Tigre",
    5: "Embarazada", 6: "Elefante", 7: "Navaja", 8: "Conejo", 9: "Hombre",
    10: "Anillo", 11: "Perro", 12: "Caballo", 13: "Gato", 14: "Boda",
    15: "Ratón", 16: "Niña", 17: "Joven", 18: "Ángel", 19: "Mariposa",
    20: "Espejo", 21: "Pájaro", 22: "Ataúd", 23: "Mono", 24: "Sapo",
    25: "Balanza", 26: "Bandera", 27: "Juego", 28: "Gallo", 29: "Padre",
    30: "Bolo", 31: "Alacrán", 32: "Culebra", 33: "Carpintero", 34: "Música",
    35: "Virgen", 36: "Ciejita", 37: "Suerte", 38: "Pistola", 39: "Jabón",
    40: "Cielo", 41: "Novia", 42: "Madre", 43: "Pantera", 44: "Mesas",
    45: "Iglesia", 46: "Familia", 47: "Banco", 48: "Estrella", 49: "Sombra",
    50: "Luna Nueva", 51: "Policía", 52: "Zorrillo", 53: "Llanta", 54: "Licor",
    55: "Olas", 56: "Árbol", 57: "Cuchillo", 58: "Venado", 59: "Selva",
    60: "Dragón", 61: "Guerra", 62: "Lagarto", 63: "Coco", 64: "Mueble",
    65: "Pintura", 66: "Diablo", 67: "Vaca", 68: "Ladrón", 69: "Soldado",
    70: "Oro", 71: "Zapatos", 72: "Arco", 73: "Fuego", 74: "Edificio",
    75: "Reina", 76: "Palomas", 77: "Humo", 78: "Tienda", 79: "Flores",
    80: "Café", 81: "Rieles", 82: "Escuela", 83: "Bote", 84: "Coronas",
    85: "Casa", 86: "Reloj", 87: "León", 88: "Platos", 89: "Búho",
    90: "Lentes", 91: "Tortuga", 92: "Águila", 93: "Cartero", 94: "Carro",
    95: "Costurera", 96: "Dinero", 97: "Viejito", 98: "Bailes", 99: "Aretes"
};

function getSign(number) {
    const num = parseInt(number);
    return LOTTERY_SIGNS[num] || "Desconocido";
}

function getNumberBySign(signName) {
    const lower = signName.toLowerCase();
    for (const [num, sign] of Object.entries(LOTTERY_SIGNS)) {
        if (sign.toLowerCase() === lower) return parseInt(num);
    }
    return null;
}

module.exports = { LOTTERY_SIGNS, getSign, getNumberBySign };
