/**
 * Honduras Lottery - Tablas Jaladoras
 * Traditional "pulling numbers" system used in Central American lotteries
 * Each number "pulls" 3 others at +25, +50, +75 intervals (mod 100)
 */

/**
 * Get the numbers that a given number "pulls"
 * @param {number} number - The source number (0-99)
 * @returns {number[]} Array of 3 pulled numbers
 */
function getJaladores(number) {
    const num = parseInt(number) % 100;
    return [
        (num + 25) % 100,
        (num + 50) % 100,
        (num + 75) % 100
    ];
}

/**
 * Get which numbers "pull" a given number
 * @param {number} number - The target number (0-99)
 * @returns {number[]} Array of numbers that pull this one
 */
function getJaladoresDe(number) {
    const num = parseInt(number) % 100;
    return [
        (num + 25) % 100,  // This number pulls our target
        (num + 50) % 100,
        (num + 75) % 100
    ];
}

/**
 * Get the complete row (group) for a number
 * All numbers in the same row pull each other
 * @param {number} number - Any number in the group (0-99)
 * @returns {number[]} Array of 4 numbers that form the pulling group
 */
function getGrupoJalador(number) {
    const num = parseInt(number) % 100;
    const base = num % 25; // Find the base of the group (0-24)
    return [
        base,
        base + 25,
        base + 50,
        base + 75
    ];
}

/**
 * Check if two numbers are in the same pulling group
 * @param {number} num1 
 * @param {number} num2 
 * @returns {boolean}
 */
function sonJaladores(num1, num2) {
    return (num1 % 25) === (num2 % 25);
}

/**
 * Generate the complete Tabla Jaladora (all 25 groups)
 * @returns {Object} Complete table with groups
 */
function getTablaCompleta() {
    const tabla = {};
    for (let base = 0; base < 25; base++) {
        const grupo = [base, base + 25, base + 50, base + 75];
        tabla[base] = {
            grupo: grupo,
            numeros: grupo.map(n => n.toString().padStart(2, "0"))
        };
    }
    return tabla;
}

/**
 * Analyze last results and suggest based on jaladores
 * @param {number[]} lastResults - Array of recent winning numbers
 * @returns {Object} Analysis with suggested numbers
 */
function analizarJaladores(lastResults) {
    if (!lastResults || lastResults.length === 0) {
        return { sugerencias: [], mensaje: "No hay resultados para analizar" };
    }

    const ultimoNumero = lastResults[0];
    const jaladores = getJaladores(ultimoNumero);
    const grupo = getGrupoJalador(ultimoNumero);
    
    // Count frequency of each group in recent results
    const grupoFreq = {};
    lastResults.forEach(num => {
        const base = num % 25;
        grupoFreq[base] = (grupoFreq[base] || 0) + 1;
    });

    // Find hot groups (appeared multiple times)
    const hotGroups = Object.entries(grupoFreq)
        .filter(([_, freq]) => freq >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([base, freq]) => ({
            base: parseInt(base),
            grupo: getGrupoJalador(parseInt(base)),
            frecuencia: freq
        }));

    return {
        ultimoNumero: ultimoNumero,
        jaladores: jaladores,
        grupoCompleto: grupo,
        mensaje: `El ${ultimoNumero.toString().padStart(2, "0")} jala: ${jaladores.map(n => n.toString().padStart(2, "0")).join(", ")}`,
        gruposCalientes: hotGroups,
        sugerencias: jaladores
    };
}

/**
 * Get jalador score for prediction integration
 * @param {number} candidateNumber - Number to score
 * @param {number} lastWinner - Last winning number
 * @returns {number} Score 0-100
 */
function getJaladorScore(candidateNumber, lastWinner) {
    if (sonJaladores(candidateNumber, lastWinner)) {
        // Direct jalador relationship = high score
        return 85;
    }
    
    // Check if shares any group members recently
    const candidateGroup = getGrupoJalador(candidateNumber);
    const winnerGroup = getGrupoJalador(lastWinner);
    
    // If groups are adjacent (bases differ by 1), medium score
    const baseDiff = Math.abs((candidateNumber % 25) - (lastWinner % 25));
    if (baseDiff === 1 || baseDiff === 24) {
        return 40;
    }
    
    return 10; // Base score for non-related numbers
}

module.exports = {
    getJaladores,
    getJaladoresDe,
    getGrupoJalador,
    sonJaladores,
    getTablaCompleta,
    analizarJaladores,
    getJaladorScore
};

