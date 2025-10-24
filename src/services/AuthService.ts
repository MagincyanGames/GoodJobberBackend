import jwt from "@tsndr/cloudflare-worker-jwt";

export interface JWTPayload {
  userId: number;
  name: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  constructor(private secret: string) {}

  async generateToken(userId: number, name: string): Promise<string> {
    const payload: JWTPayload = {
      userId,
      name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
    };

    return await jwt.sign(payload, this.secret);
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const isValid = await jwt.verify(token, this.secret);
      if (!isValid) return null;

      const decoded = jwt.decode(token);
      return decoded.payload as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    // En un entorno real, usa bcrypt o argon2
    // Para Cloudflare Workers, usamos Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }
}
