import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("📅 Asignando clases a Jamal...");

  // 1. Buscamos a Jamal
  const jamal = await prisma.profesor.findFirst({
    where: { email: 'jamal.bahssain.ajbal@iesfelixdeazara.com' }
  });

  if (!jamal) {
    console.log("❌ Error: No encuentro a Jamal. Ejecuta primero 'crear_jamal.ts'");
    return;
  }

  // 2. CORRECCIÓN AQUÍ: Solo usamos 'id', borramos 'nombre' que daba error
  await prisma.cursoAcademico.upsert({
    where: { id: '24-25' },
    update: {},
    create: { 
        id: '24-25' 
        // He quitado 'nombre' porque tu base de datos no lo tiene
    }
  });

  // 3. Borramos horarios viejos
  await prisma.horario.deleteMany({
    where: { profesorId: jamal.id }
  });

  // 4. Creamos clases nuevas
  await prisma.horario.createMany({
    data: [
      {
        diaSemana: 1, // Lunes
        horaClase: 1, // 1ª Hora
        asignatura: 'Despliegue de Apps',
        profesorId: jamal.id,
        cursoId: '24-25',
        aulaId: 1
      },
      {
        diaSemana: 3, // Miércoles
        horaClase: 3, // 3ª Hora
        asignatura: 'Base de Datos',
        profesorId: jamal.id,
        cursoId: '24-25',
        aulaId: 1
      }
    ]
  });

  console.log("✅ ¡Horario asignado correctamente!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });