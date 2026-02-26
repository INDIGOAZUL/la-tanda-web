const fs = require("fs");
const { Pool } = require("pg");
require("dotenv").config({ path: "/var/www/latanda.online/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Animal names for Honduras lottery (00-99)
const animals = {
  "00": "Ballena", "01": "Carnero", "02": "Toro", "03": "Ciempiés", "04": "Alacrán",
  "05": "León", "06": "Rana", "07": "Perico", "08": "Ratón", "09": "Águila",
  "10": "Tigre", "11": "Gato", "12": "Caballo", "13": "Mono", "14": "Paloma",
  "15": "Zorro", "16": "Oso", "17": "Pavo", "18": "Burro", "19": "Chivo",
  "20": "Cochino", "21": "Gallo", "22": "Camello", "23": "Cebra", "24": "Iguana",
  "25": "Gallina", "26": "Vaca", "27": "Perro", "28": "Zamuro", "29": "Elefante",
  "30": "Caimán", "31": "Lapa", "32": "Ardilla", "33": "Pescado", "34": "Venado",
  "35": "Jirafa", "36": "Culebra", "37": "Delfín", "38": "Conejo", "39": "Mariposa",
  "40": "Alacrán", "41": "Canguro", "42": "Palomo", "43": "Gusano", "44": "Cangrejo",
  "45": "Pez", "46": "Murciélago", "47": "Avispa", "48": "Tortuga", "49": "Escorpión",
  "50": "Búho", "51": "Camarón", "52": "Lobo", "53": "Tiburón", "54": "Lombriz",
  "55": "Canario", "56": "Araña", "57": "Loro", "58": "Pingüino", "59": "Mosca",
  "60": "Pulpo", "61": "Pantera", "62": "Gavilán", "63": "Cotorra", "64": "Abeja",
  "65": "Cóndor", "66": "Langosta", "67": "Garza", "68": "Cocodrilo", "69": "Sapo",
  "70": "Halcón", "71": "Cuervo", "72": "Jabalí", "73": "Ganso", "74": "Tucán",
  "75": "Mapache", "76": "Erizo", "77": "Hipopótamo", "78": "Foca", "79": "Gorila",
  "80": "Hormiga", "81": "Leopardo", "82": "Puma", "83": "Rinoceronte", "84": "Orca",
  "85": "Hiena", "86": "Caracol", "87": "Pelícano", "88": "Dragón", "89": "Lince",
  "90": "Ballena", "91": "Serpiente", "92": "Pantera", "93": "Pavo Real", "94": "Flamenco",
  "95": "Lechuza", "96": "Cabra", "97": "Nutria", "98": "Jaguar", "99": "Cóndor"
};

async function importData() {
  const data = JSON.parse(fs.readFileSync("/var/www/latanda.online/lottery-data-combined.json"));
  console.log(`Importing ${data.length} records...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const item of data) {
    const number = parseInt(item.number, 10);
    const paddedNumber = item.number.padStart(2, "0");
    const animal = animals[paddedNumber] || "Desconocido";
    
    try {
      const result = await pool.query(`
        INSERT INTO hn_lottery_draws (draw_date, draw_time, main_number, animal_name, lottery_type, scraped_from, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (draw_date, draw_time, lottery_type) DO NOTHING
        RETURNING id
      `, [item.date, item.time, number, animal, "la_diaria", "lotodehonduras.com"]);
      
      if (result.rowCount > 0) {
        imported++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Error importing ${item.date} ${item.time}:`, err.message);
    }
  }
  
  console.log(`\nImported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  
  // Get final count
  const countResult = await pool.query("SELECT COUNT(*), MIN(draw_date), MAX(draw_date) FROM hn_lottery_draws");
  console.log(`\nTotal records: ${countResult.rows[0].count}`);
  console.log(`Date range: ${countResult.rows[0].min} to ${countResult.rows[0].max}`);
  
  await pool.end();
}

importData().catch(console.error);
