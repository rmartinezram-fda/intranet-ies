import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ... imports ...

async function main() {
  // ... código anterior ...
  
  // Aquí pones los EMAILS REALES que has creado en Google
  const usuarios = [
    { nombre: 'Profesor', apellido: 'Moodle', email: 'profesormoodle@iesfelixdeazara.com', dep: 'Informática' },
    { nombre: 'Director', apellido: 'Ficticio', email: 'directorficticio@iesfelixdeazara.com', dep: 'Inglés' },
    { nombre: 'Responsable', apellido: 'Mia', email: 'responsablemia@iesfelixdeazara.com', dep: 'Innovación' },
    { nombre: 'Cofotap', apellido: 'Cofotap', email: 'directorficticio@iesfelixdeazara.com', dep: 'Innovación' }
    // Añade aquí todos los que hayas creado en Google
  ];

  // ... bucle para insertarlos en la base de datos ...
}
// ...

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });