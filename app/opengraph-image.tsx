import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Mindspire Lab Classroom — Interactive chemistry classroom'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const iconSvg = await readFile(join(process.cwd(), 'app', 'icon.svg'), 'utf8')
  const iconSrc = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#581c87',
          fontFamily: 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={180} height={180} style={{ borderRadius: 36 }} alt="" />
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 700, color: 'white' }}>
          Mindspire Lab Classroom
        </div>
        <div style={{ marginTop: 16, fontSize: 32, color: '#e9d5ff' }}>
          Interactive chemistry classroom
        </div>
      </div>
    ),
    { ...size }
  )
}
