import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Reparando datos...");

  // 1. Asegurar que Jamal existe y tiene la contraseña bien
  const passwordSegura = await bcrypt.hash("1234", 10);

  const jamal = await prisma.profesor.upsert({
    where: { email: 'jamal.bahssain.ajbal@iesfelixdeazara.com' },
    update: { 
        password: passwordSegura, // Si existe, le ponemos la contraseña bien
        rol_id: 2
    },
    create: {
      email: 'jamal.bahssain.ajbal@iesfelixdeazara.com',
      password: passwordSegura,
      nombre: 'Jamal',
      apellidos: 'Bahssain',
      departamento: 'Informática',
      activo: true,
      rol_id: 2
    }
  });
  console.log(`✅ USUARIO: ${jamal.email} (OK)`);

  // 2. Asegurar que el AULA 1 existe (FUNDAMENTAL para reservar)
  const aula = await prisma.aula.upsert({
    where: { id: 1 },
    update: {}, // Si existe, no tocamos nada
    create: {
      id: 1,
      nombre: 'Aula de Informática'
    }
  });
  console.log(`✅ AULA: ${aula.nombre} (ID: ${aula.id}) (OK)`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });