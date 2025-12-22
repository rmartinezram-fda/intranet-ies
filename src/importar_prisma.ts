import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const CURSO_ACTUAL = "2025-2026"; 

const MAPA_HORAS: { [key: number]: number } = { 1:1, 2:2, 3:3, 5:4, 6:5, 7:6, 8:7 };
const MAPA_DIAS: { [key: number]: number } = { 1:1, 2:2, 3:3, 4:4, 5:5 };

async function main() {
  const rutaArchivo = path.join(__dirname, '../20250915_Profesores.xlsx'); 

  if (!fs.existsSync(rutaArchivo)) {
    console.error(`❌ No encuentro el archivo: ${rutaArchivo}`);
    return;
  }

  console.log(`🌱 Iniciando importación MAESTRA (Modo Seguro)...`);

  // 1. Limpieza
  await prisma.horario.deleteMany({ where: { cursoId: CURSO_ACTUAL } });
  await prisma.profesor.deleteMany({}); 
  console.log("🧹 Base de datos limpia.");

  // 2. Crear Curso
  await prisma.cursoAcademico.upsert({
    where: { id: CURSO_ACTUAL },
    update: { actual: true },
    create: { id: CURSO_ACTUAL, actual: true }
  });

  // 3. Generar hash de contraseña "1234"
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("1234", salt);

  const workbook = xlsx.readFile(rutaArchivo);
  let contador = 0;

  for (const nombreHoja of workbook.SheetNames) {
    const hoja = workbook.Sheets[nombreHoja];
    if (!hoja) continue; 

    // Forzamos el tipo a any[][] para evitar peleas con TS
    const datos: any[][] = xlsx.utils.sheet_to_json(hoja, { header: 1 }) as any[][];
    if (!datos || datos.length < 5) continue;

    // --- CORRECCIÓN ERROR LÍNEA 56 ---
    // Verificamos que la fila 0 existe antes de leerla
    const primeraFila = datos[0];
    if (!primeraFila || !primeraFila[0]) continue;
    
    let nombreRaw = primeraFila[0] as string; 
    // ---------------------------------
    
    // --- CORRECCIÓN ERRORES LÍNEAS 60-61 ---
    // Aseguramos que split no falle
    let parteNombre = "";
    let departamento: string | null = null;

    if (nombreRaw.includes('-')) {
        const trozos = nombreRaw.split('-');
        parteNombre = trozos[0] ? trozos[0].trim() : "Desconocido";
        departamento = trozos[1] ? trozos[1].trim() : null;
    } else {
        parteNombre = nombreRaw.trim();
    }
    // ---------------------------------------

    // --- CORRECCIÓN ERRORES LÍNEAS 69-70 ---
    let nombre = "";
    let apellidos = "";
    
    if (parteNombre.includes(',')) {
        const partes = parteNombre.split(',');
        apellidos = partes[0] ? partes[0].trim() : ""; 
        nombre = partes[1] ? partes[1].trim() : "";    
    } else {
        apellidos = parteNombre;
        nombre = "Docente";
    }
    // ---------------------------------------

    // Generar Email
    const emailBase = `${nombre}.${apellidos}`
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, ".") 
        .replace(/\.+/g, "."); 

    const email = `${emailBase}@iesfelixdeazara.com`;

    // Crear Profesor
    const profesor = await prisma.profesor.create({
      data: { 
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        departamento: departamento,
        password: passwordHash, 
        rol_id: 2,
        activo: true
      }
    });

    contador++;
    process.stdout.write(`\r Procesando: ${nombre} ${apellidos}`.padEnd(50));

    // Lógica de horarios
    for (let filaIdx = 0; filaIdx < datos.length; filaIdx++) {
      const horaClase = MAPA_HORAS[filaIdx];
      if (!horaClase) continue;
      
      // --- CORRECCIÓN ERROR LÍNEA 108 ---
      const fila = datos[filaIdx];
      if (!fila) continue; // Si la fila no existe, saltamos
      // ----------------------------------

      for (let colIdx = 1; colIdx <= 5; colIdx++) {
        const diaSemana = MAPA_DIAS[colIdx];
        const celda = fila[colIdx];
        
        if (!celda || typeof celda !== 'string') continue;
        
        const partes = celda.split(/\r?\n/).map((s: string) => s.trim()).filter((s: string) => s !== '');
        
        // --- CORRECCIÓN ERROR LÍNEA 116 ---
        // Asignamos cadena vacía si es undefined para que TS no se queje
        let asignatura = partes[0] || ""; 
        if (asignatura === "") continue;
        // ----------------------------------

        let grupoNombre = partes[1] || null;
        let aulaNombre = partes[2] || null;

        if (asignatura.toUpperCase().includes('GUARDIA')) {
            asignatura = 'GUARDIA';
            grupoNombre = null;
            if (!aulaNombre) aulaNombre = 'Sala Profesores';
        }

        let aulaId = null;
        if (aulaNombre) {
          const aula = await prisma.aula.upsert({
            where: { nombre: aulaNombre },
            update: {},
            create: { nombre: aulaNombre }
          });
          aulaId = aula.id;
        }

        let grupoId = null;
        if (grupoNombre) {
          const grupo = await prisma.grupo.upsert({
            where: { nombre: grupoNombre },
            update: {},
            create: { nombre: grupoNombre }
          });
          grupoId = grupo.id;
        }

        await prisma.horario.create({
          data: {
            diaSemana, horaClase, asignatura,
            profesorId: profesor.id,
            aulaId, grupoId,
            cursoId: CURSO_ACTUAL
          }
        });
      }
    }
  }
  console.log(`\n✅ ¡HECHO! ${contador} usuarios creados.`);
  console.log(`🔑 Contraseña para todos: 1234`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });