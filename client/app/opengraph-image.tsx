import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'forge — Stop shipping half-baked tickets';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  const iconPath = join(process.cwd(), 'public', 'forge-icon.png');
  const iconData = await readFile(iconPath);
  const iconBase64 = `data:image/png;base64,${iconData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
        }}
      >
        <img
          src={iconBase64}
          width={280}
          height={280}
          style={{
            filter: 'brightness(0) invert(1)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
