// Script para crear tablas de PostgreSQL desde n8n
const fs = require('fs');
const { Client } = require('pg');

// Credenciales según la configuración de n8n
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres' // Contraseña predeterminada
});

// Leer archivo SQL
const sqlScript = fs.readFileSync('/home/ebanksnigel/create_latanda_tables.sql', 'utf8');

async function createTables() {
  try {
    // Conectar a PostgreSQL
    await client.connect();
    console.log('Conectado a PostgreSQL');
    
    // Ejecutar script SQL
    console.log('Ejecutando script SQL...');
    await client.query(sqlScript);
    
    console.log('¡Tablas creadas exitosamente!');
  } catch (error) {
    console.error('Error al crear tablas:', error);
  } finally {
    // Cerrar conexión
    await client.end();
  }
}

createTables();