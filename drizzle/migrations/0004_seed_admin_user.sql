-- Migración: Insertar usuario administrador inicial
-- Este usuario se crea con credenciales por defecto que DEBEN cambiarse en producción
-- Usuario: admin
-- Contraseña: admin123
-- Hash generado con SHA-256

-- Solo insertar si no existe ningún usuario llamado 'admin'
INSERT INTO users (name, hash, is_admin) 
SELECT 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE name = 'admin');

-- IMPORTANTE: Cambia la contraseña del administrador después de la primera conexión
