-- Base de datos para el proyecto INTRANET

-- 1. Tabla de departamentos
CREATE TABLE departamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100) NOT NULL
);

-- 3. TABLA INTERMEDIA: usuario_departamentos
CREATE TABLE usuario_departamentos (
    usuario_id INT NOT NULL,
    departamento_id INT NOT NULL,
    PRIMARY KEY (usuario_id, departamento_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE
);

-- 4. Tabla de roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- 5. Tabla intermedia para roles
CREATE TABLE usuario_roles (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 6. Gestión de sustituciones
CREATE TABLE sustituciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titular_id INT NOT NULL,
    sustituto_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (titular_id) REFERENCES usuarios(id),
    FOREIGN KEY (sustituto_id) REFERENCES usuarios(id)
);

-- DATOS INICIALES
INSERT INTO roles (nombre) VALUES 
('ADMIN'), ('TUTOR'), ('JEFE DEPARTAMENTO'), ('EQUIPO DIRECTIVO'), ('PROFESOR');

INSERT INTO departamentos (nombre) VALUES 
('BIOLOGIA_Y_GEOLOGIA'), ('CLASICAS'), ('ARTES_PLASTICAS'), ('ECONOMIA'), 
('EDUCACION_FISICA'), ('FILOSOFIA'), ('FRANCES'), ('FISICA_Y_QUIMICA'), 
('GEOGRAFIA_HISTORIA'), ('INFORMATICA'), ('INGLES'), ('INNOVACION'), 
('LENGUA_CASTELLANA_LITERATURA'), ('MATEMATICAS'), ('MUSICA'), 
('ORIENTACION'), ('TECNOLOGIA'), ('RELIGIONES');