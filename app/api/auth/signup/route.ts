import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 422 }
      );
    }

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 422 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 422 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (unverified)
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      name: name || '',
      verified: false,
      verificationCode,
      verificationExpiry,
      createdAt: new Date(),
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);
    
    if (!emailResult.success) {
      console.warn('Failed to send verification email:', emailResult.error);
      // Continue anyway - user can request new code
    }

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email for verification code.',
        userId: result.insertedId.toString(),
        email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
