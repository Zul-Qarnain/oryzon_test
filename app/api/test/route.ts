import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  return NextResponse.json({ businessId });
}
