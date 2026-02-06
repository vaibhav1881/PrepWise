import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { message: 'Email, code, and new password are required' },
        { status: 422 }
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find user with matching email and reset code
    const user = await db.collection('users').findOne({ 
      email,
      resetCode: code,
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid reset code' },
        { status: 422 }
      );
    }

    // Check if code is expired
    if (user.resetExpiry && new Date(user.resetExpiry) < new Date()) {
      return NextResponse.json(
        { message: 'Reset code has expired' },
        { status: 422 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and remove reset fields
    await db.collection('users').updateOne(
      { email },
      { 
        $set: { password: hashedPassword },
        $unset: { resetCode: "", resetExpiry: "" }
      }
    );

    return NextResponse.json(
      {
        message: 'Password reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
