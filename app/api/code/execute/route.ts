import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { language, code } = await request.json();

        if (!language || !code) {
            return NextResponse.json(
                { message: 'Language and code are required' },
                { status: 400 }
            );
        }

        // Map common names to Wandbox compilers
        const runtimes: Record<string, string> = {
            javascript: 'nodejs-20.17.0',
            typescript: 'typescript-5.6.2',
            python: 'cpython-3.14.0',
            java: 'openjdk-jdk-22+36',
            c: 'gcc-head-c',
            cpp: 'gcc-head',
            go: 'go-1.23.2',
            rust: 'rust-1.82.0',
            php: 'php-8.3.12',
        };

        const compiler = runtimes[language] || runtimes.python;

        const response = await fetch('https://wandbox.org/api/compile.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                compiler,
            }),
        });

        const rawData = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: rawData.message || 'Execution failed' },
                { status: response.status }
            );
        }

        // Map Wandbox response back to Piston-compatible format for UI
        const stdout = rawData.program_output || rawData.compiler_output || '';
        const stderr = rawData.program_error || rawData.compiler_error || '';
        const output = rawData.program_message || rawData.compiler_message || [stdout, stderr].filter(Boolean).join('\n') || '';

        const data = {
            run: {
                stdout,
                stderr,
                output,
                code: rawData.status === '0' ? 0 : 1,
            }
        };

        // enhance error message for common issues
        // enhance error message for common issues
        if (data.run && data.run.stderr) {
            const stderr = data.run.stderr;
            if (
                stderr.includes('MODULE_NOT_FOUND') ||
                stderr.includes('Cannot find module') ||
                stderr.includes('ModuleNotFoundError') ||
                stderr.includes('ImportError')
            ) {
                data.run.output += `\n\n⚠️ SANDBOX LIMITATION: External packages (like 'express', 'react', 'fastapi', 'pandas') are NOT available in this environment.\n\n💡 TIP: To demonstrate your answer:\n1. Use standard libraries (e.g., 'http' in Node, 'http.server' in Python)\n2. Mock the import/class (e.g., class FastAPI { ... })\n3. Write the logic without the framework wrapper`;
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Code Execution] Error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
