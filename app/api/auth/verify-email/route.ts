import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find user with matching email and code
    const user = await db.collection('users').findOne({ 
      email,
      verificationCode: code,
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 422 }
      );
    }

    // Check if code is expired
    if (user.verificationExpiry && new Date(user.verificationExpiry) < new Date()) {
      return NextResponse.json(
        { message: 'Verification code has expired' },
        { status: 422 }
      );
    }

    // Update user as verified and remove verification fields
    await db.collection('users').updateOne(
      { email },
      { 
        $set: { verified: true },
        $unset: { verificationCode: "", verificationExpiry: "" }
      }
    );

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name || '',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
