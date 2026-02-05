import { NextResponse } from 'next/server';
import { execPromise } from '@/lib/manager';
import { getInstanceByName } from '@/lib/db';
import { withApiLogging } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export const POST = withApiLogging(async (req, { params }) => {
  try {
    const { name } = params;
    const instance = await getInstanceByName(name);

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    await execPromise(`pm2 restart ${name}`);
    return NextResponse.json({ message: 'Instance restarted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
