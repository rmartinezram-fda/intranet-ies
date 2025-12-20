import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

import { pool } from './database.js';
// Mantenemos estos tipos solo para documentar, pero los usaremos de forma que TS no se queje
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface FilaExcel {
    A: string | null;
    B: string | null;
    C: string | null;
}

async function importar() {
    try {
        console.log('⏳ Cargando archivo Excel...');
        const workbook = XLSX.readFile('./profesores.xlsx');
        const hoja = workbook.Sheets[workbook.SheetNames[0]!];
        const filas = XLSX.utils.sheet_to_json(hoja, { header: 'A', defval: null }) as FilaExcel[];

        let departamentoIdActual: number | null = null;

        console.log('🚀 Iniciando proceso de importación...');

        for (const fila of filas) {
            if (fila.A && typeof fila.A === 'string' && !fila.A.includes('@')) {
                const nombreDep = fila.A.trim();
                
                // Quitamos el <RowDataPacket[]> de aquí para evitar el error 2347
                const [deps]: any = await pool.query('SELECT id FROM departamentos WHERE nombre = ?', [nombreDep]);

                if (deps && deps[0]) {
                    departamentoIdActual = deps[0].id;
                    console.log(`\n📂 Departamento: ${nombreDep}`);
                } else {
                    departamentoIdActual = null;
                }
            }

            const email = fila.C?.trim();
            const nombreCompleto = fila.B?.trim();

            if (departamentoIdActual && email && email.includes('@') && nombreCompleto) {
                const partes = nombreCompleto.split(/\s+/);
                const apellido2 = partes.pop() || '';
                const apellido1 = partes.pop() || '';
                const nombre = partes.join(' ');
                const apellidos = `${apellido1} ${apellido2}`.trim();

                // Buscamos usuario (usamos 'any' para evitar el conflicto de tipos)
                const [usuarios]: any = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

                let usuarioId: number;

                if (usuarios && usuarios[0]) {
                    usuarioId = usuarios[0].id;
                    await pool.query('UPDATE usuarios SET nombre = ?, apellidos = ? WHERE id = ?', [nombre, apellidos, usuarioId]);
                } else {
                    const [res]: any = await pool.query('INSERT INTO usuarios (email, nombre, apellidos) VALUES (?, ?, ?)', [email, nombre, apellidos]);
                    usuarioId = res.insertId;
                    
                    // Rol PROFESOR
                    await pool.query('INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, 5)', [usuarioId]);
                }

                // Vinculación
                await pool.query('INSERT IGNORE INTO usuario_departamentos (usuario_id, departamento_id) VALUES (?, ?)', [usuarioId, departamentoIdActual]);

                console.log(`   ✅ ${nombre} ${apellidos}`);
            }
        }
        console.log('\n✨ ¡Importación finalizada!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

importar();