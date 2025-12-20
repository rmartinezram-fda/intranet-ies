import { pool } from './database.js';

async function auditar() {
    try {
        console.log('--- 📊 INFORME DE ESTADO DE LA INTRANET ---\n');

        // 1. Total de profesores únicos
        const [totalProf]: any = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        console.log(`👤 Total profesores registrados: ${totalProf[0].total}`);

        // 2. Profesores sin departamento (posible error en nombre de dep. en Excel)
        const [sinDep]: any = await pool.query(`
            SELECT nombre, apellidos, email 
            FROM usuarios 
            WHERE id NOT IN (SELECT usuario_id FROM usuario_departamentos)
        `);

        if (sinDep.length > 0) {
            console.log('\n⚠️ ATENCIÓN: Profesores sin departamento asignado:');
            console.table(sinDep);
            console.log('💡 Consejo: Revisa si el nombre del departamento en el Excel coincide exactamente con los del init.sql');
        } else {
            console.log('\n✅ Todos los profesores tienen al menos un departamento.');
        }

        // 3. Profesores en varios departamentos (tu nueva funcionalidad)
        const [multiDep]: any = await pool.query(`
            SELECT u.nombre, u.apellidos, COUNT(ud.departamento_id) as num_deps
            FROM usuarios u
            JOIN usuario_departamentos ud ON u.id = ud.usuario_id
            GROUP BY u.id
            HAVING num_deps > 1
        `);

        if (multiDep.length > 0) {
            console.log('\n👥 Profesores adscritos a varios departamentos:');
            console.table(multiDep);
        }

        // 4. Conteo por departamento
        const [porDep]: any = await pool.query(`
            SELECT d.nombre, COUNT(ud.usuario_id) as total
            FROM departamentos d
            LEFT JOIN usuario_departamentos ud ON d.id = ud.departamento_id
            GROUP BY d.id
            ORDER BY total DESC
        `);
        console.log('\n🏢 Profesores por departamento:');
        console.table(porDep);

    } catch (error) {
        console.error('❌ Error en la auditoría:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

auditar();