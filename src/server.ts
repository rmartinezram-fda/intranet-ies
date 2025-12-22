import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors'; // Para que el frontend pueda conectarse sin problemas
import jwt from 'jsonwebtoken'; // <--- NUEVO
import bcrypt from 'bcryptjs'; // <--- MOVIDO ARRIBA (Donde debe estar)

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;
const SECRET_KEY = "B@rbuñ@les1742B@rbuñ@les1821"; // Clave secreta para JWT

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const autenticarToken = (req: any, res: any, next: any) => {
  // 1. Buscamos el token en la cabecera "Authorization"
  const authHeader = req.headers['authorization']; 
  // El formato suele ser: "Bearer EYJhbGci..." así que separamos por espacio
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: No tienes token' });
  }

  // 2. Verificamos si el token es válido y no ha caducado
  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    // 3. Si todo está bien, guardamos los datos del usuario en la petición y dejamos pasar
    req.user = user;
    next();
  });
};

// --- MIDDLEWARE DE AUTORIZACIÓN (ROLES) ---
// Esta función devuelve OTRA función middleware configurada para el rol que le pidas
const autorizarRol = (rolesPermitidos: number[]) => {
  return (req: any, res: any, next: any) => {
    // req.user ya existe gracias a 'autenticarToken'
    if (!req.user || !rolesPermitidos.includes(req.user.rol_id)) {
      return res.status(403).json({ error: 'Acceso prohibido: No tienes permisos suficientes para esto.' });
    }
    next(); // Si tiene el rol adecuado, pasa
  };
};

// Middlewares globales
app.use(express.json()); // Para entender JSON en las peticiones
app.use(cors()); // Permite conexiones externas

// --- RUTAS DE LA API ---

// Ruta de bienvenida para comprobar que la API está viva
app.get('/', (req, res) => {
  res.send('¡Hola! La API del IES Félix de Azara está funcionando. Ve a /api/profesores para ver datos.');
});

// 1. Obtener TODOS los profesores
app.get('/api/profesores', async (req, res) => {
  try {
    const profesores = await prisma.profesor.findMany({
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        departamento: true,
        activo: true,
      },
      orderBy: {
        apellidos: 'asc',
      }
    });
    res.json(profesores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener profesores' });
  }
});

// 2. Obtener UN profesor por ID
app.get('/api/profesores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const profesor = await prisma.profesor.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        departamento: true
      }
    });

    if (!profesor) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    res.json(profesor);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el profesor' });
  }
});

// 3. Endpoint de LOGIN (POST)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // A. Buscar el usuario por email
    const profesor = await prisma.profesor.findUnique({
      where: { email: email }
    });

    // Si no existe el usuario, devolvemos error (401 = No autorizado)
    if (!profesor) {
      return res.status(401).json({ error: 'Credenciales inválidas (usuario no existe)' });
    }

    // B. Comparar la contraseña que nos envían con el hash de la BD
    const validPassword = await bcrypt.compare(password, profesor.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas (contraseña incorrecta)' });
    }
    
    // C. GENERAR TOKEN JWT
    const token = jwt.sign(
      { userId: profesor.id, email: profesor.email, rol_id: profesor.rol_id },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    // D. Devolver token y datos
    res.json({
      message: 'Login exitoso',
      token: token, 
      user: {
        id: profesor.id,
        nombre: profesor.nombre,
        email: profesor.email,
        rol_id: profesor.rol_id
      }
    });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor durante el login' });
  }
}); // <--- Aquí se cierra correctamente el app.post

// 4. Ruta PROTEGIDA (Solo funciona si tienes token)
// ¡Esta ruta debe ir FUERA del app.post!
app.get('/api/perfil', autenticarToken, (req: any, res: any) => {
  res.json({
    mensaje: "¡Felicidades! Has entrado en la zona segura.",
    tus_datos_desencriptados: req.user
  });
});

// 5. Ver MI HORARIO (Ruta protegida)
app.get('/api/mi-horario', autenticarToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId; // Sacamos el ID del token (ej: el de Jamal)

    const horario = await prisma.horario.findMany({
      where: {
        profesorId: userId // Solo buscamos las clases de ESTE profesor
      },
      include: {
        aula: true,   // Trae los datos del Aula (no solo el ID)
        grupo: true,  // Trae los datos del Grupo (no solo el ID)
        curso: true   // Trae el curso académico
      },
      orderBy: [
        { diaSemana: 'asc' }, // Ordenar por Lunes, Martes...
        { horaClase: 'asc' }  // Ordenar por 1ª hora, 2ª hora...
      ]
    });

    res.json(horario);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el horario' });
  }
});

// --- RUTAS DE RESERVAS ---

// 6. CREAR RESERVA (POST) - VERSIÓN BLINDADA 🛡️
app.post('/api/reservas', autenticarToken, async (req: any, res: any) => {
  console.log("📥 Intento de reserva recibido:", req.body); // Veremos esto en la terminal

  try {
    // 1. LIMPIEZA DE DATOS (Convertir texto a números/fechas)
    const aulaId = parseInt(req.body.aulaId);
    const horaInicio = parseInt(req.body.horaInicio);
    const fechaTexto = req.body.fecha; // Viene como "2023-11-20"
    
    // Convertimos la fecha a objeto Date real
    const fecha = new Date(fechaTexto);

    // Verificamos que los datos sean válidos
    if (isNaN(aulaId) || isNaN(horaInicio) || !fechaTexto) {
      console.log("❌ Datos inválidos recibidos");
      return res.status(400).json({ error: 'Faltan datos o son incorrectos (aula, hora o fecha).' });
    }

    const usuarioId = req.user.userId;

    // 2. COMPROBAR SI EL AULA EXISTE
    const existeAula = await prisma.aula.findUnique({ where: { id: aulaId }});
    if (!existeAula) {
        console.log("❌ El aula no existe: " + aulaId);
        return res.status(404).json({ error: `El Aula con ID ${aulaId} no existe en la base de datos.` });
    }

    // 3. COMPROBAR SI YA ESTÁ OCUPADA
    // Buscamos reservas en esa misma aula, ese mismo día, a esa misma hora
    const ocupada = await prisma.reserva.findFirst({
      where: {
        aulaId: aulaId,
        fecha: fecha,
        horaInicio: horaInicio
      }
    });

    if (ocupada) {
      console.log("⛔ Aula ocupada");
      return res.status(409).json({ error: '⛔ EL AULA YA ESTÁ OCUPADA a esa hora.' });
    }

    // 4. GUARDAR RESERVA
    const nuevaReserva = await prisma.reserva.create({
      data: {
        fecha: fecha,
        horaInicio: horaInicio,
        horaFin: horaInicio + 1, // Asumimos que dura 1 hora
        aulaId: aulaId,
        profesorId: usuarioId,
        motivo: 'Clase reservada desde Web'
      }
    });

    console.log("✅ Reserva creada con éxito:", nuevaReserva.id);
    res.json({ mensaje: '✅ ¡Reserva confirmada!', reserva: nuevaReserva });

  } catch (error: any) {
    console.error("🔥 ERROR GRAVE EN SERVIDOR:", error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
});

// 7. VER MIS RESERVAS (GET) - Para saber qué he reservado yo
app.get('/api/mis-reservas', autenticarToken, async (req: any, res: any) => {
    const reservas = await prisma.reserva.findMany({
        where: { profesorId: req.user.userId },
        include: { aula: true },
        orderBy: { fecha: 'desc' } // Las más recientes primero
    });
    res.json(reservas);
});

// Ruta VIP: Solo para el rol 1 (Supongamos que es Dirección/Admin)
// Fíjate que ponemos DOS porteros: primero valida el token, luego valida el rol
app.get('/api/admin/panel', autenticarToken, autorizarRol([1]), (req: any, res: any) => {
  res.json({
    mensaje: "👋 Hola Jefe. Aquí tienes los controles nucleares.",
    usuario: req.user
  });
});

// 8. CANCELAR RESERVA (DELETE)
app.delete('/api/reservas/:id', autenticarToken, async (req: any, res: any) => {
  try {
    const idReserva = parseInt(req.params.id); // El ID viene en la URL
    const idProfesor = req.user.userId; // El usuario que intenta borrar

    // 1. Buscamos la reserva para ver de quién es
    const reserva = await prisma.reserva.findUnique({
      where: { id: idReserva }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Esa reserva no existe.' });
    }

    // 2. SEGURIDAD: ¿Es tuya la reserva?
    if (reserva.profesorId !== idProfesor) {
      return res.status(403).json({ error: '⛔ No puedes borrar reservas de otros compañeros.' });
    }

    // 3. Si es tuya, la borramos
    await prisma.reserva.delete({
      where: { id: idReserva }
    });

    res.json({ mensaje: '🗑️ Reserva cancelada correctamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar.' });
  }
});

// --- MIDDLEWARE: Solo para Directores ---
// Esto actúa como un portero de discoteca VIP
const soloDirectores = async (req: any, res: any, next: any) => {
    // El usuario ya viene autenticado por 'autenticarToken'
    // Solo comprobamos su ROL en la base de datos
    const usuario = await prisma.profesor.findUnique({
        where: { id: req.user.userId }
    });

    if (usuario && usuario.rol_id === 1) {
        next(); // ¡Pase usted, señor Director!
    } else {
        res.status(403).json({ error: '⛔ ACCESO DENEGADO: Zona exclusiva para Dirección.' });
    }
};

// 9. ZONA VIP (Panel de Administración)
// Fíjate que ponemos DOS porteros: primero autenticarToken, luego soloDirectores
app.get('/api/admin/panel', autenticarToken, soloDirectores, async (req: any, res: any) => {
    
    // El director puede ver TODOS los usuarios del sistema
    const totalUsuarios = await prisma.profesor.count();
    const totalReservas = await prisma.reserva.count();
    
    res.json({ 
        mensaje: `Bienvenido Director. Hay ${totalUsuarios} profesores y ${totalReservas} reservas activas.`,
        datos_sensibles: "Aquí irían los botones para despedir gente o borrar usuarios..."
    });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
});