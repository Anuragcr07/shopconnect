// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, role, shopName, address, phone } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (role === 'SHOPKEEPER' && (!shopName || !address || !phone)) {
      return NextResponse.json({ message: 'Shop name, address, and phone are required for shopkeepers' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        shopName: role === 'SHOPKEEPER' ? shopName : null,
        address: role === 'SHOPKEEPER' ? address : null,
        phone: role === 'SHOPKEEPER' ? phone : null,
        // Latitude and Longitude for shopkeepers will be set later, e.g., on profile edit or geocoding address
        // For now, they can be null, or you can add a default (e.g., center of a city)
      },
    });

    // Don't return password hash
    const { passwordHash, ...userWithoutHash } = user;

    return NextResponse.json(userWithoutHash, { status: 201 });
  } catch (error) {
    console.error('Error in /api/users POST:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}