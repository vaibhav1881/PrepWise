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

        // Map common names to Piston language versions (approximate)
        // Piston supports many, but let's stick to common ones for now.
        // Versions can be omitted if the API auto-detects, but usually required.
        // Actually, version is required. Let's fetch available runtimes first or hardcode common ones.
        // For simplicity, we'll use "latest" logic or just hardcode a known good one.
        // Piston API: POST https://emkc.org/api/v2/piston/execute

        // Hardcoded versions for common languages (to avoid extra API call)
        // Check https://emkc.org/api/v2/piston/runtimes for current list if needed.
        const runtimes: Record<string, string> = {
            javascript: '18.15.0',
            typescript: '5.0.3',
            python: '3.10.0',
            java: '15.0.2',
            c: '10.2.0',
            cpp: '10.2.0',
            go: '1.16.2',
            rust: '1.68.2',
            php: '8.2.3',
        };

        const version = runtimes[language] || '*';

        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language,
                version,
                files: [
                    {
                        content: code,
                    },
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { message: data.message || 'Execution failed' },
                { status: response.status }
            );
        }

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
