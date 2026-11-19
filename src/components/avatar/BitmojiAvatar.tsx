import React from 'react';
import { AvatarConfig } from '../../types';

interface BitmojiAvatarProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
  fullBody?: boolean;
  showBackground?: boolean;
}

export const BitmojiAvatar: React.FC<BitmojiAvatarProps> = ({
  avatar,
  size = 48,
  className = '',
  fullBody = false,
  showBackground = true,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const skin = avatar.skinColor || '#E0AC69';
  const hair = avatar.hairColor || '#1C1917';
  const top = avatar.topColor || '#18181B';
  const bottom = avatar.bottomColor || '#1E293B';
  const bg = avatar.background || '#FFFC00';

  // Head geometry based on faceShape
  const headRx =
    avatar.faceShape === 'round'
      ? 31
      : avatar.faceShape === 'square'
        ? 29
        : avatar.faceShape === 'diamond'
          ? 27
          : 28;
  const headRy =
    avatar.faceShape === 'round'
      ? 31
      : avatar.faceShape === 'heart'
        ? 33
        : 34;

  // Pose adjustments
  const isSleeping = avatar.pose === 'sleeping' || avatar.expression === 'sleeping';
  const isCrying = avatar.pose === 'crying' || avatar.expression === 'crying';
  const isLaughing = avatar.pose === 'laughing' || avatar.expression === 'laughing';
  const isCool = avatar.pose === 'cool' || avatar.expression === 'cool';
  const isThinking = avatar.pose === 'thinking' || avatar.expression === 'thinking';
  const isSurprised = avatar.pose === 'surprised' || avatar.expression === 'surprised';
  const isWink = avatar.expression === 'wink';
  const isDancing = avatar.pose === 'dancing';
  const isSitting = avatar.pose === 'sitting';

  const headTilt = isDancing ? -5 : isThinking ? 4 : isCool ? -3 : 0;
  const viewBox = fullBody ? '0 0 140 190' : '0 0 120 120';

  const renderBackHair = () => {
    switch (avatar.hairStyle) {
      case 'longwave':
        return (
          <path
            d="M28 52 C22 72, 22 104, 34 114 L86 114 C98 104, 98 72, 92 52 C88 26, 32 26, 28 52 Z"
            fill={hair}
          />
        );
      case 'bob':
        return (
          <path
            d="M27 50 C24 72, 26 92, 36 96 L84 96 C94 92, 96 72, 93 50 C88 24, 32 24, 27 50 Z"
            fill={hair}
          />
        );
      case 'afro':
        return <circle cx="60" cy="48" r="40" fill={hair} />;
      case 'ponytail':
        return (
          <g>
            <path d="M84 36 C106 38, 112 64, 98 86 C92 72, 90 54, 82 46 Z" fill={hair} />
            <circle cx="84" cy="39" r="5" fill="#FFFC00" />
          </g>
        );
      case 'bun':
        return <circle cx="60" cy="14" r="14" fill={hair} />;
      case 'braids':
        return (
          <g fill={hair}>
            <rect x="24" y="46" width="10" height="62" rx="5" />
            <rect x="86" y="46" width="10" height="62" rx="5" />
            <rect x="30" y="54" width="8" height="58" rx="4" opacity="0.85" />
            <rect x="82" y="54" width="8" height="58" rx="4" opacity="0.85" />
          </g>
        );
      case 'sleek':
        return (
          <path
            d="M29 46 C26 70, 28 96, 35 108 L85 108 C92 96, 94 70, 91 46 Z"
            fill={hair}
          />
        );
      default:
        return null;
    }
  };

  const renderFrontHair = () => {
    const highlight =
      avatar.hairHighlight && avatar.hairHighlight !== 'none' ? avatar.hairHighlight : null;
    switch (avatar.hairStyle) {
      case 'buzz':
        return (
          <path
            d="M32 48 C32 24, 88 24, 88 48 C80 38, 40 38, 32 48 Z"
            fill={hair}
          />
        );
      case 'shortfade':
        return (
          <g>
            <path
              d="M31 48 C30 22, 46 16, 62 16 C78 16, 90 24, 89 48 C83 34, 72 31, 58 31 C44 31, 36 36, 31 48 Z"
              fill={hair}
            />
            {highlight && (
              <path d="M52 20 Q64 22 72 30" stroke={highlight} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      case 'curly':
        return (
          <g fill={hair}>
            <circle cx="38" cy="34" r="12" />
            <circle cx="52" cy="24" r="13" />
            <circle cx="68" cy="24" r="13" />
            <circle cx="82" cy="34" r="12" />
            <circle cx="60" cy="20" r="11" />
          </g>
        );
      case 'messy':
        return (
          <g>
            <path
              d="M30 48 C29 22, 45 14, 61 15 C78 15, 91 25, 90 48 C83 36, 75 34, 68 38 C61 30, 52 35, 45 40 C39 36, 34 40, 30 48 Z"
              fill={hair}
            />
            {highlight && (
              <path d="M47 22 Q56 26 53 36" stroke={highlight} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      case 'parted':
        return (
          <path
            d="M30 50 C29 21, 50 16, 62 16 C79 16, 90 25, 90 50 C81 36, 70 30, 56 34 C44 37, 36 42, 30 50 Z"
            fill={hair}
          />
        );
      case 'afro':
        return (
          <path
            d="M28 42 C32 22, 88 22, 92 42 C78 32, 42 32, 28 42 Z"
            fill={hair}
          />
        );
      default:
        return (
          <g>
            <path
              d="M30 50 C30 22, 48 17, 60 17 C72 17, 90 22, 90 50 C82 35, 68 29, 60 34 C52 29, 38 35, 30 50 Z"
              fill={hair}
            />
            {highlight && (
              <path d="M72 24 Q78 32 76 42" stroke={highlight} strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </g>
        );
    }
  };

  const renderEyes = () => {
    if (isSleeping) {
      return (
        <g stroke="#18181B" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M41 56 Q46 60 51 56" />
          <path d="M69 56 Q74 60 79 56" />
        </g>
      );
    }

    const ry =
      avatar.eyeShape === 'big'
        ? 5.4
        : avatar.eyeShape === 'wide'
          ? 4.6
          : avatar.eyeShape === 'relaxed'
            ? 3.1
            : 4.1;
    const rx = avatar.eyeShape === 'big' ? 5.2 : 4.6;

    return (
      <g>
        {/* Left Eye */}
        <ellipse cx="46" cy="56" rx={rx} ry={ry} fill="#FFFFFF" />
        <circle cx="46.5" cy="56" r={ry * 0.72} fill={avatar.eyeColor || '#1C1917'} />
        <circle cx="47.8" cy="54.8" r="1.3" fill="#FFFFFF" />

        {/* Right Eye */}
        {isWink ? (
          <path d="M69 56 Q74 52 79 56" stroke="#18181B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx="74" cy="56" rx={rx} ry={ry} fill="#FFFFFF" />
            <circle cx="74.5" cy="56" r={ry * 0.72} fill={avatar.eyeColor || '#1C1917'} />
            <circle cx="75.8" cy="54.8" r="1.3" fill="#FFFFFF" />
          </>
        )}
      </g>
    );
  };

  const renderEyebrows = () => {
    const strokeW = avatar.eyebrows === 'thick' ? 3.2 : 2.1;
    const lift = isSurprised ? -3 : isThinking ? -2 : 0;
    return (
      <g stroke={hair} strokeWidth={strokeW} fill="none" strokeLinecap="round">
        {avatar.eyebrows === 'arched' ? (
          <>
            <path d={`M39 ${48 + lift} Q46 ${43 + lift} 53 ${47 + lift}`} />
            <path d={`M67 ${47 + lift} Q74 ${43 + lift} 81 ${48 + lift}`} />
          </>
        ) : avatar.eyebrows === 'straight' ? (
          <>
            <path d={`M39 ${47 + lift} L53 ${47 + lift}`} />
            <path d={`M67 ${47 + lift} L81 ${47 + lift}`} />
          </>
        ) : (
          <>
            <path d={`M39 ${48 + lift} Q46 ${45 + lift} 53 ${47 + lift}`} />
            <path d={`M67 ${47 + (isThinking ? -4 : lift)} Q74 ${44 + (isThinking ? -4 : lift)} 81 ${48 + (isThinking ? -3 : lift)}`} />
          </>
        )}
      </g>
    );
  };

  const renderMouth = () => {
    if (isLaughing) {
      return (
        <g>
          <path d="M47 71 Q60 85 73 71 Z" fill="#FFFFFF" stroke="#18181B" strokeWidth="1.6" />
          <path d="M52 77 Q60 82 68 77" fill="#FB7185" />
        </g>
      );
    }
    if (isSurprised) {
      return <ellipse cx="60" cy="74" rx="5.5" ry="7" fill="#450A0A" stroke="#18181B" strokeWidth="1.5" />;
    }
    if (isCrying) {
      return (
        <g>
          <path d="M50 77 Q60 70 70 77" stroke="#18181B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M43 60 C41 66, 42 70, 44 70 C46 70, 47 66, 45 60 Z" fill="#38BDF8" />
          <path d="M75 60 C73 66, 74 70, 76 70 C78 70, 79 66, 77 60 Z" fill="#38BDF8" />
        </g>
      );
    }
    if (isSleeping) {
      return <ellipse cx="60" cy="74" rx="3.5" ry="2.5" fill="#450A0A" />;
    }
    if (isThinking) {
      return <path d="M52 74 Q60 72 68 75" stroke="#18181B" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    }
    if (isCool || avatar.lips === 'smile') {
      return <path d="M49 71 Q60 80 72 70" stroke="#18181B" strokeWidth="2.3" fill="none" strokeLinecap="round" />;
    }
    return (
      <path
        d="M50 72 Q60 78 70 72"
        stroke="#9F1239"
        strokeWidth={avatar.lips === 'full' ? 3.4 : 2.2}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const renderFacialHair = () => {
    switch (avatar.facialHair) {
      case 'stubble':
        return (
          <path
            d="M35 64 C35 84, 85 84, 85 64 C82 78, 38 78, 35 64 Z"
            fill={hair}
            opacity="0.22"
          />
        );
      case 'beard':
        return (
          <path
            d="M33 61 C32 88, 88 88, 87 61 C82 74, 72 78, 60 78 C48 78, 38 74, 33 61 Z"
            fill={hair}
            opacity="0.92"
          />
        );
      case 'goatee':
        return (
          <path
            d="M51 77 C51 87, 69 87, 69 77 C65 81, 55 81, 51 77 Z"
            fill={hair}
          />
        );
      case 'mustache':
        return (
          <path
            d="M47 68 Q54 64 60 67 Q66 64 73 68 Q66 70 60 68 Q54 70 47 68 Z"
            fill={hair}
          />
        );
      default:
        return null;
    }
  };

  const renderEyewear = () => {
    switch (avatar.eyewear) {
      case 'sunglasses':
        return (
          <g>
            <rect x="34" y="49" width="22" height="14" rx="4" fill="#09090B" stroke="#FFFC00" strokeWidth="1.8" />
            <rect x="64" y="49" width="22" height="14" rx="4" fill="#09090B" stroke="#FFFC00" strokeWidth="1.8" />
            <line x1="56" y1="54" x2="64" y2="54" stroke="#FFFC00" strokeWidth="2" />
          </g>
        );
      case 'tinted':
        return (
          <g>
            <rect x="35" y="49" width="21" height="14" rx="5" fill="rgba(245, 158, 11, 0.55)" stroke="#18181B" strokeWidth="1.8" />
            <rect x="64" y="49" width="21" height="14" rx="5" fill="rgba(245, 158, 11, 0.55)" stroke="#18181B" strokeWidth="1.8" />
            <line x1="56" y1="54" x2="64" y2="54" stroke="#18181B" strokeWidth="1.8" />
          </g>
        );
      case 'round_glasses':
        return (
          <g fill="none" stroke="#E4E4E7" strokeWidth="2">
            <circle cx="46" cy="56" r="10" />
            <circle cx="74" cy="56" r="10" />
            <line x1="56" y1="56" x2="64" y2="56" />
          </g>
        );
      case 'square_glasses':
        return (
          <g fill="none" stroke="#18181B" strokeWidth="2.2">
            <rect x="35" y="49" width="21" height="14" rx="2" />
            <rect x="64" y="49" width="21" height="14" rx="2" />
            <line x1="56" y1="55" x2="64" y2="55" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderHeadwear = () => {
    switch (avatar.headwear) {
      case 'cap':
        return (
          <g>
            <path d="M29 40 C30 16, 90 16, 91 40 Z" fill="#18181B" />
            <path d="M26 39 Q60 33 98 42 Q76 44 26 39 Z" fill="#27272A" />
            <circle cx="60" cy="27" r="3.5" fill="#FFFC00" />
          </g>
        );
      case 'beanie':
        return (
          <g>
            <path d="M29 42 C30 14, 90 14, 91 42 Z" fill="#27272A" />
            <rect x="27" y="34" width="66" height="11" rx="5" fill="#3F3F46" />
          </g>
        );
      case 'bucket_hat':
        return (
          <g>
            <path d="M34 35 L38 18 L82 18 L86 35 Z" fill="#FDE047" />
            <path d="M20 40 Q60 31 100 40 L94 45 Q60 38 26 45 Z" fill="#EAB308" />
          </g>
        );
      case 'headband':
        return <path d="M31 40 Q60 28 89 40" stroke="#FFFC00" strokeWidth="5" fill="none" strokeLinecap="round" />;
      default:
        return null;
    }
  };

  const renderOutfitAndBody = () => {
    const offsetX = fullBody ? 10 : 0;
    const legsY = isSitting ? 132 : 138;

    return (
      <g transform={`translate(${offsetX}, 0)`}>
        {/* Neck */}
        <rect x="52" y="80" width="16" height="16" rx="6" fill={skin} />

        {/* Lower Body (fullBody only) */}
        {fullBody && (
          <g>
            {isSitting ? (
              <>
                <rect x="34" y="132" width="22" height="32" rx="8" fill={bottom} />
                <rect x="64" y="132" width="22" height="32" rx="8" fill={bottom} />
              </>
            ) : (
              <>
                <rect x="38" y={legsY} width="18" height={avatar.bottomStyle === 'shorts' ? 22 : 36} rx="7" fill={bottom} />
                <rect x="64" y={legsY} width="18" height={avatar.bottomStyle === 'shorts' ? 22 : 36} rx="7" fill={bottom} />
                {avatar.bottomStyle === 'shorts' && (
                  <>
                    <rect x="41" y={legsY + 18} width="12" height="18" rx="5" fill={skin} />
                    <rect x="67" y={legsY + 18} width="12" height="18" rx="5" fill={skin} />
                  </>
                )}
              </>
            )}
            {/* Shoes */}
            <rect x="35" y="170" width="23" height="11" rx="5" fill={avatar.shoesStyle === 'boots' ? '#451A03' : '#FFFFFF'} />
            <rect x="62" y="170" width="23" height="11" rx="5" fill={avatar.shoesStyle === 'boots' ? '#451A03' : '#FFFFFF'} />
          </g>
        )}

        {/* Torso */}
        <path
          d={
            fullBody
              ? 'M26 102 C26 91, 42 88, 60 88 C78 88, 94 91, 94 102 L90 142 L30 142 Z'
              : 'M22 120 C22 95, 38 89, 60 89 C82 89, 98 95, 98 120 Z'
          }
          fill={top}
        />

        {/* Hoodie strings or jacket zipper */}
        {avatar.topStyle === 'hoodie' && (
          <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85">
            <line x1="53" y1="93" x2="53" y2="111" />
            <line x1="67" y1="93" x2="67" y2="111" />
          </g>
        )}
        {avatar.topStyle === 'jacket' && (
          <line x1="60" y1="90" x2="60" y2={fullBody ? 140 : 120} stroke="#FFFC00" strokeWidth="2.2" />
        )}
        {avatar.topStyle === 'collared' && (
          <g fill="#FFFFFF" opacity="0.9">
            <polygon points="48,89 60,99 54,102" />
            <polygon points="72,89 60,99 66,102" />
          </g>
        )}

        {/* Jewelry chain */}
        {(avatar.jewelry === 'chain' || avatar.jewelry === 'both') && (
          <path d="M48 92 Q60 105 72 92" stroke="#FACC15" strokeWidth="2.5" fill="none" />
        )}

        {/* Pose arms / gestures */}
        {isDancing && (
          <g stroke={top} strokeWidth="10" strokeLinecap="round">
            <line x1="30" y1="100" x2="14" y2="82" />
            <line x1="90" y1="100" x2="106" y2="82" />
            <circle cx="13" cy="80" r="5" fill={skin} stroke="none" />
            <circle cx="107" cy="80" r="5" fill={skin} stroke="none" />
          </g>
        )}
        {isCool && (
          <g>
            <circle cx="96" cy="96" r="6" fill={skin} />
            <line x1="94" y1="93" x2="92" y2="84" stroke={skin} strokeWidth="2.6" strokeLinecap="round" />
            <line x1="98" y1="93" x2="101" y2="84" stroke={skin} strokeWidth="2.6" strokeLinecap="round" />
          </g>
        )}
        {isThinking && (
          <g>
            <circle cx="48" cy="85" r="5.5" fill={skin} />
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden select-none shrink-0 ${className}`}
      style={{
        width: size,
        height: fullBody ? Math.round(size * 1.35) : size,
        backgroundColor: showBackground ? bg : 'transparent',
      }}
    >
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        aria-label="Bitmoji Avatar"
      >
        <defs>
          <clipPath id={`clip_${uid}`}>
            <rect x="0" y="0" width={fullBody ? 140 : 120} height={fullBody ? 190 : 120} />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip_${uid})`}>
          {renderOutfitAndBody()}

          <g transform={`translate(${fullBody ? 10 : 0}, 0) rotate(${headTilt}, 60, 56)`}>
            {renderBackHair()}

            {/* Headphones */}
            {avatar.accessory === 'headphones' && (
              <g>
                <path d="M27 56 C27 18, 93 18, 93 56" stroke="#27272A" strokeWidth="5" fill="none" />
                <rect x="21" y="47" width="9" height="18" rx="4" fill="#FFFC00" />
                <rect x="90" y="47" width="9" height="18" rx="4" fill="#FFFC00" />
              </g>
            )}

            {/* Ears */}
            <circle cx="31" cy="56" r="6" fill={skin} />
            <circle cx="89" cy="56" r="6" fill={skin} />
            {(avatar.ears === 'pierced' || avatar.jewelry === 'earrings' || avatar.jewelry === 'both') && (
              <g fill="#FFFC00">
                <circle cx="30" cy="61" r="2" />
                <circle cx="90" cy="61" r="2" />
              </g>
            )}

            {/* Face */}
            <ellipse cx="60" cy="54" rx={headRx} ry={headRy} fill={skin} />

            {/* Subtle cheek blush */}
            <ellipse cx="42" cy="63" rx="5" ry="2.8" fill="#FB7185" opacity="0.22" />
            <ellipse cx="78" cy="63" rx="5" ry="2.8" fill="#FB7185" opacity="0.22" />

            {renderFacialHair()}
            {renderEyebrows()}
            {renderEyes()}

            {/* Nose */}
            <path
              d={
                avatar.nose === 'wide'
                  ? 'M56 62 Q60 65 64 62'
                  : avatar.nose === 'button'
                    ? 'M58 62 Q60 64 62 62'
                    : 'M60 55 L58 63 L62 63'
              }
              stroke="#78350F"
              strokeOpacity="0.45"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {renderMouth()}
            {renderFrontHair()}
            {renderEyewear()}
            {renderHeadwear()}

            {/* Pose expressions overlays */}
            {isSleeping && (
              <text x="88" y="24" fill="#FFFFFF" fontSize="11" fontWeight="bold" stroke="#000" strokeWidth="0.6">
                Zzz
              </text>
            )}
            {isDancing && (
              <text x="92" y="26" fill="#FFFC00" fontSize="13" fontWeight="bold">
                ♪
              </text>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};
