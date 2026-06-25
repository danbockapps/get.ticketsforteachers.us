import {ImageResponse} from 'next/og'

// Square brand favicon: a gold ticket on the brand blue, matching the logo.
export const size = {width: 64, height: 64}
export const contentType = 'image/png'

const BLUE = '#1B3D7D'
const GOLD = '#EEC55B'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BLUE,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 46,
          height: 30,
          background: GOLD,
          border: `3px solid ${BLUE}`,
        }}
      >
        {/* Notches that give the ticket its shape */}
        <div
          style={{
            position: 'absolute',
            left: -5,
            top: 7,
            width: 10,
            height: 10,
            borderRadius: 10,
            background: BLUE,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -5,
            top: 7,
            width: 10,
            height: 10,
            borderRadius: 10,
            background: BLUE,
          }}
        />
      </div>
    </div>,
    {...size},
  )
}
