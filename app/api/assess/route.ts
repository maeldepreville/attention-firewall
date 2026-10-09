import { handle } from '../../../server/model.mjs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) { return handle(request); }
