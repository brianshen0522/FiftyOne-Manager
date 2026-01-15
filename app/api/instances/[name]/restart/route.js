import { NextResponse } from 'next/server';
import { execPromise, loadInstances } from '@/lib/manager';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { name } = params;
    const instances = loadInstances();
    const instance = instances.find((item) => item.name === name);

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    await execPromise(`pm2 restart ${name}`);
    return NextResponse.json({ message: 'Instance restarted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
