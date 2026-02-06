import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { sendPasswordResetEmail, generateVerificationCode } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Valid email address is required' },
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user exists
    const user = await db.collection('users').findOne({ email });
    
    // For security, don't reveal if user exists or not
    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists with this email, a password reset code has been sent.' },
        { status: 200 }
      );
    }

    // Generate password reset code
    const resetCode = generateVerificationCode();
    const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset code to user
    await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          resetCode,
          resetExpiry 
        }
      }
    );

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, resetCode);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { message: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'If an account exists with this email, a password reset code has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
