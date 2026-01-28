export async function GET() {
  return Response.json({
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001'
  });
}
