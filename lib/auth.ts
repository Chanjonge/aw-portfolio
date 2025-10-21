import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await compare(password, hashedPassword);
}

export function generateToken(userId: string, role: string): string {
    return sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
    try {
        return verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch {
        return null;
    }
}
