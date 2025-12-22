import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("👔 Contratando al Director...");

  const passwordSegura = await bcrypt.hash("admin123", 10);

  const skinner = await prisma.profesor.upsert({
    where: { email: 'director@iesfelixdeazara.com' },
    update: { 
        password: passwordSegura,
        rol_id: 1 // <--- ROL 1 = DIRECTOR
    },
    create: {
      email: 'director@iesfelixdeazara.com',
      password: passwordSegura,
      nombre: 'Seymour',
      apellidos: 'Skinner',
      departamento: 'Dirección',
      activo: true,
      rol_id: 1 // <--- IMPORTANTE
    }
  });

  console.log(`✅ DIRECTOR CREADO: ${skinner.email}`);
  console.log(`🔑 Contraseña: admin123`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });