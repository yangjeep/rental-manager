import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for Google Drive images
 * Usage: /api/image?url=<encoded-google-drive-url>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Decode the URL - handle both encoded and unencoded URLs
    let decodedUrl = imageUrl;
    try {
      decodedUrl = decodeURIComponent(imageUrl);
    } catch (e) {
      // If decoding fails, use the original URL
      decodedUrl = imageUrl;
    }
    
    // Fetch the image from Google Drive
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers and aggressive caching
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800', // Cache for 24 hours, stale for 7 days
      },
    });
  } catch (error) {
    console.error('[image-proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

