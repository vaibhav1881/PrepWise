import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@/lib/groq';
import { validateAudioFile } from '@/lib/interview-types';
import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Route segment config for Next.js App Router
export const maxDuration = 60; // Maximum duration in seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!groq) {
      return NextResponse.json(
        { message: 'Groq API not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { message: 'Audio file is required' },
        { status: 422 }
      );
    }

    // Validate audio file
    const validation = validateAudioFile(audioFile);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 422 }
      );
    }

    console.log(`[Whisper] Processing audio file: ${audioFile.name}, size: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`);

    // Convert File to Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save temporarily (Whisper API needs file path)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'audio');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const tempFileName = `temp_${Date.now()}_${audioFile.name}`;
    const tempFilePath = join(uploadsDir, tempFileName);
    await writeFile(tempFilePath, buffer);

    try {
      // Read the file as a buffer for Groq API
      const fileBuffer = await readFile(tempFilePath);
      
      // Create a File object from the buffer
      const audioFileForGroq = new File([fileBuffer], audioFile.name, {
        type: audioFile.type || 'audio/webm',
      });

      // Transcribe using Whisper
      const transcription = await groq.audio.transcriptions.create({
        file: audioFileForGroq,
        model: "whisper-large-v3",
        language: "en", // Set to English, remove if you want auto-detection
        response_format: "json",
        temperature: 0.0,
      });

      const transcribedText = transcription.text;

      console.log(`[Whisper] Transcription successful: ${transcribedText.substring(0, 100)}...`);

      // Clean up temp file
      await unlink(tempFilePath);

      return NextResponse.json(
        {
          message: 'Audio transcribed successfully',
          transcript: transcribedText,
        },
        { status: 200 }
      );
    } catch (whisperError) {
      // Clean up temp file on error
      if (existsSync(tempFilePath)) {
        await unlink(tempFilePath);
      }
      throw whisperError;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Whisper] Error:', errorMsg);
    return NextResponse.json(
      { message: `Transcription failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
