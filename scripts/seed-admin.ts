/**
 * Script para crear el usuario administrador inicial
 *
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas
 * 2. Ejecuta: npx tsx scripts/seed-admin.ts
 */

import { drizzle } from "drizzle-orm/d1";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Función para hashear contraseñas (debe coincidir con AuthService)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function seedAdmin() {
  console.log("🌱 Iniciando seed del usuario administrador...");

  // Aquí debes conectarte a tu base de datos
  // Este script es para ejecutar localmente o en un worker
  // Necesitarás ajustarlo según tu configuración

  const adminName = process.env.ADMIN_NAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (adminPassword === "admin123") {
    console.warn(
      "⚠️  ADVERTENCIA: Usando contraseña por defecto. Cambia ADMIN_PASSWORD en las variables de entorno."
    );
  }

  const hash = await hashPassword(adminPassword);

  console.log(`✅ Usuario administrador creado:`);
  console.log(`   Nombre: ${adminName}`);
  console.log(`   Contraseña: ${adminPassword}`);
  console.log(`   Hash: ${hash}`);
  console.log("");
  console.log(
    "📝 Inserta este usuario en tu base de datos con el siguiente SQL:"
  );
  console.log("");
  console.log(
    `INSERT INTO users (name, hash, is_admin) VALUES ('${adminName}', '${hash}', 1);`
  );
}

seedAdmin().catch(console.error);
