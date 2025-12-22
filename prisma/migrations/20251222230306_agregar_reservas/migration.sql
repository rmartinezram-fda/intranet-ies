-- CreateTable
CREATE TABLE `CursoAcademico` (
    `id` VARCHAR(191) NOT NULL,
    `actual` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `departamento` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `rol_id` INTEGER NOT NULL DEFAULT 2,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Aula` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Aula_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grupo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Grupo_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `diaSemana` INTEGER NOT NULL,
    `horaClase` INTEGER NOT NULL,
    `asignatura` VARCHAR(191) NOT NULL,
    `profesorId` INTEGER NOT NULL,
    `aulaId` INTEGER NULL,
    `grupoId` INTEGER NULL,
    `cursoId` VARCHAR(191) NOT NULL,

    INDEX `Horario_profesorId_idx`(`profesorId`),
    INDEX `Horario_diaSemana_horaClase_idx`(`diaSemana`, `horaClase`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL,
    `horaInicio` INTEGER NOT NULL,
    `horaFin` INTEGER NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `profesorId` INTEGER NOT NULL,
    `aulaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_profesorId_fkey` FOREIGN KEY (`profesorId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_aulaId_fkey` FOREIGN KEY (`aulaId`) REFERENCES `Aula`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `Grupo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_cursoId_fkey` FOREIGN KEY (`cursoId`) REFERENCES `CursoAcademico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_profesorId_fkey` FOREIGN KEY (`profesorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_aulaId_fkey` FOREIGN KEY (`aulaId`) REFERENCES `Aula`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
