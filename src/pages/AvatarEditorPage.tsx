import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, RotateCcw, Save, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import {
  AccessoryStyle,
  AvatarConfig,
  AvatarPose,
  BottomStyle,
  EyeShape,
  EyebrowStyle,
  EyewearStyle,
  FaceShape,
  FacialExpression,
  FacialHair,
  HairStyle,
  HeadwearStyle,
  JewelryStyle,
  LipStyle,
  NoseStyle,
  ShoeStyle,
  TopStyle,
} from '../types';

const SKIN_TONES = ['#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3317'];
const HAIR_COLORS = ['#09090B', '#292524', '#451A03', '#B45309', '#EAB308', '#DC2626', '#EC4899', '#38BDF8', '#E4E4E7'];
const CLOTH_COLORS = ['#18181B', '#FFFC00', '#FFFFFF', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#F97316', '#EC4899'];
const BACKGROUNDS = ['#FFFC00', '#38BDF8', '#A855F7', '#F43F5E', '#10B981', '#F59E0B', '#6366F1', '#18181B'];

const FACE_SHAPES: FaceShape[] = ['oval', 'round', 'square', 'heart', 'diamond'];
const EYE_SHAPES: EyeShape[] = ['almond', 'round', 'wide', 'relaxed', 'big'];
const EYEBROWS: EyebrowStyle[] = ['natural', 'arched', 'thick', 'straight'];
const NOSES: NoseStyle[] = ['classic', 'button', 'narrow', 'wide'];
const LIPS: LipStyle[] = ['natural', 'full', 'thin', 'smile'];
const EXPRESSIONS: FacialExpression[] = ['smiling', 'laughing', 'cool', 'surprised', 'thinking', 'crying', 'sleeping', 'wink'];
const FACIAL_HAIRS: FacialHair[] = ['none', 'stubble', 'beard', 'mustache', 'goatee'];
const HAIR_STYLES: HairStyle[] = ['shortfade', 'curly', 'afro', 'longwave', 'bob', 'ponytail', 'messy', 'braids', 'parted', 'buzz', 'bun', 'sleek'];
const TOP_STYLES: TopStyle[] = ['tshirt', 'hoodie', 'jacket', 'sweater', 'collared', 'tank'];
const BOTTOM_STYLES: BottomStyle[] = ['jeans', 'pants', 'shorts'];
const SHOE_STYLES: ShoeStyle[] = ['sneakers', 'boots', 'slides'];
const EYEWEAR: EyewearStyle[] = ['none', 'sunglasses', 'round_glasses', 'square_glasses', 'tinted'];
const HEADWEAR: HeadwearStyle[] = ['none', 'cap', 'beanie', 'bucket_hat', 'headband'];
const JEWELRY: JewelryStyle[] = ['none', 'chain', 'earrings', 'both'];
const ACCESSORIES: AccessoryStyle[] = ['none', 'headphones', 'watch', 'bag'];
const POSES: AvatarPose[] = ['standing', 'sitting', 'laughing', 'smiling', 'crying', 'surprised', 'cool', 'thinking', 'sleeping', 'dancing'];

export const AvatarEditorPage: React.FC = () => {
  const { currentUser, updateAvatar } = useApp();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<AvatarConfig>(
    currentUser?.avatar || {
      faceShape: 'oval',
      skinColor: '#E0AC69',
      eyeShape: 'almond',
      eyeColor: '#3B2F2F',
      eyebrows: 'natural',
      nose: 'classic',
      lips: 'smile',
      expression: 'smiling',
      ears: 'normal',
      facialHair: 'none',
      hairStyle: 'messy',
      hairColor: '#1C1917',
      hairHighlight: 'none',
      topStyle: 'hoodie',
      topColor: '#18181B',
      bottomStyle: 'jeans',
      bottomColor: '#1E293B',
      shoesStyle: 'sneakers',
      eyewear: 'none',
      headwear: 'none',
      jewelry: 'none',
      accessory: 'none',
      pose: 'cool',
      background: '#FFFC00',
    }
  );
  const [fullBody, setFullBody] = useState(true);
  const [category, setCategory] = useState<'face' | 'hair' | 'outfit' | 'accessories' | 'pose'>('face');

  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const handleRandomize = () => {
    setDraft({
      faceShape: pickRandom(FACE_SHAPES),
      skinColor: pickRandom(SKIN_TONES),
      eyeShape: pickRandom(EYE_SHAPES),
      eyeColor: pickRandom(['#1C1917', '#3B2F2F', '#2563EB', '#15803D']),
      eyebrows: pickRandom(EYEBROWS),
      nose: pickRandom(NOSES),
      lips: pickRandom(LIPS),
      expression: pickRandom(EXPRESSIONS),
      ears: pickRandom(['normal', 'pierced']),
      facialHair: pickRandom(FACIAL_HAIRS),
      hairStyle: pickRandom(HAIR_STYLES),
      hairColor: pickRandom(HAIR_COLORS),
      hairHighlight: pickRandom(['none', '#FFFC00', '#EC4899', '#38BDF8']),
      topStyle: pickRandom(TOP_STYLES),
      topColor: pickRandom(CLOTH_COLORS),
      bottomStyle: pickRandom(BOTTOM_STYLES),
      bottomColor: pickRandom(['#18181B', '#1E293B', '#334155', '#F5F5F4']),
      shoesStyle: pickRandom(SHOE_STYLES),
      eyewear: pickRandom(EYEWEAR),
      headwear: pickRandom(HEADWEAR),
      jewelry: pickRandom(JEWELRY),
      accessory: pickRandom(ACCESSORIES),
      pose: pickRandom(POSES),
      background: pickRandom(BACKGROUNDS),
    });
  };

  const handleReset = () => {
    if (currentUser?.avatar) setDraft(currentUser.avatar);
  };

  const handleSave = () => {
    updateAvatar(draft);
    navigate('/profile');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-[#181818] border border-[#292929] flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">Bitmoji Studio</h1>
            <p className="text-xs text-[#A1A1A1]">Customize face, hair, outfit, accessories &amp; poses</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="h-10 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-white flex items-center gap-1.5 hover:border-[#FFFC00]"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#FFFC00]" />
            Random
          </button>
          <button
            onClick={handleReset}
            className="h-10 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-[#A1A1A1] flex items-center gap-1.5 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-4 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5 hover:brightness-95"
          >
            <Save className="w-3.5 h-3.5" />
            Save Avatar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Preview Stage */}
        <div className="lg:col-span-5 bg-[#101010] border border-[#292929] rounded-3xl p-6 flex flex-col items-center">
          <BitmojiAvatar
            avatar={draft}
            size={210}
            fullBody={fullBody}
            className="rounded-3xl border border-[#292929] shadow-2xl"
          />
          <div className="mt-4 flex items-center gap-2 p-1 rounded-xl bg-[#181818] border border-[#292929]">
            <button
              onClick={() => setFullBody(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                !fullBody ? 'bg-[#FFFC00] text-black' : 'text-[#A1A1A1]'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => setFullBody(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                fullBody ? 'bg-[#FFFC00] text-black' : 'text-[#A1A1A1]'
              }`}
            >
              Full Body
            </button>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="lg:col-span-7 bg-[#101010] border border-[#292929] rounded-3xl p-5 space-y-5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-[#292929]">
            {(
              [
                ['face', 'Face & Eyes'],
                ['hair', 'Hair'],
                ['outfit', 'Outfit'],
                ['accessories', 'Accessories'],
                ['pose', 'Pose & Backdrop'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  category === id
                    ? 'bg-[#FFFC00] text-black'
                    : 'bg-[#181818] text-[#A1A1A1] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {category === 'face' && (
            <div className="space-y-4">
              <ColorPickerRow
                label="Skin Tone"
                colors={SKIN_TONES}
                value={draft.skinColor}
                onChange={(skinColor) => setDraft({ ...draft, skinColor })}
              />
              <ChipSelectRow
                label="Face Shape"
                options={FACE_SHAPES}
                value={draft.faceShape}
                onChange={(faceShape) => setDraft({ ...draft, faceShape })}
              />
              <ChipSelectRow
                label="Eye Shape"
                options={EYE_SHAPES}
                value={draft.eyeShape}
                onChange={(eyeShape) => setDraft({ ...draft, eyeShape })}
              />
              <ColorPickerRow
                label="Eye Color"
                colors={['#1C1917', '#3B2F2F', '#2563EB', '#15803D', '#7C3AED']}
                value={draft.eyeColor}
                onChange={(eyeColor) => setDraft({ ...draft, eyeColor })}
              />
              <ChipSelectRow
                label="Eyebrows"
                options={EYEBROWS}
                value={draft.eyebrows}
                onChange={(eyebrows) => setDraft({ ...draft, eyebrows })}
              />
              <ChipSelectRow
                label="Nose"
                options={NOSES}
                value={draft.nose}
                onChange={(nose) => setDraft({ ...draft, nose })}
              />
              <ChipSelectRow
                label="Lips"
                options={LIPS}
                value={draft.lips}
                onChange={(lips) => setDraft({ ...draft, lips })}
              />
              <ChipSelectRow
                label="Facial Hair"
                options={FACIAL_HAIRS}
                value={draft.facialHair}
                onChange={(facialHair) => setDraft({ ...draft, facialHair })}
              />
            </div>
          )}

          {category === 'hair' && (
            <div className="space-y-4">
              <ChipSelectRow
                label="Hairstyle"
                options={HAIR_STYLES}
                value={draft.hairStyle}
                onChange={(hairStyle) => setDraft({ ...draft, hairStyle })}
              />
              <ColorPickerRow
                label="Hair Color"
                colors={HAIR_COLORS}
                value={draft.hairColor}
                onChange={(hairColor) => setDraft({ ...draft, hairColor })}
              />
              <ColorPickerRow
                label="Highlights"
                colors={['none', '#FFFC00', '#EC4899', '#38BDF8', '#A855F7', '#FFFFFF']}
                value={draft.hairHighlight}
                onChange={(hairHighlight) => setDraft({ ...draft, hairHighlight })}
              />
            </div>
          )}

          {category === 'outfit' && (
            <div className="space-y-4">
              <ChipSelectRow
                label="Top Style"
                options={TOP_STYLES}
                value={draft.topStyle}
                onChange={(topStyle) => setDraft({ ...draft, topStyle })}
              />
              <ColorPickerRow
                label="Top Color"
                colors={CLOTH_COLORS}
                value={draft.topColor}
                onChange={(topColor) => setDraft({ ...draft, topColor })}
              />
              <ChipSelectRow
                label="Bottoms"
                options={BOTTOM_STYLES}
                value={draft.bottomStyle}
                onChange={(bottomStyle) => setDraft({ ...draft, bottomStyle })}
              />
              <ColorPickerRow
                label="Bottom Color"
                colors={['#18181B', '#1E293B', '#334155', '#475569', '#F5F5F4']}
                value={draft.bottomColor}
                onChange={(bottomColor) => setDraft({ ...draft, bottomColor })}
              />
              <ChipSelectRow
                label="Shoes"
                options={SHOE_STYLES}
                value={draft.shoesStyle}
                onChange={(shoesStyle) => setDraft({ ...draft, shoesStyle })}
              />
            </div>
          )}

          {category === 'accessories' && (
            <div className="space-y-4">
              <ChipSelectRow
                label="Eyewear"
                options={EYEWEAR}
                value={draft.eyewear}
                onChange={(eyewear) => setDraft({ ...draft, eyewear })}
              />
              <ChipSelectRow
                label="Headwear"
                options={HEADWEAR}
                value={draft.headwear}
                onChange={(headwear) => setDraft({ ...draft, headwear })}
              />
              <ChipSelectRow
                label="Jewelry"
                options={JEWELRY}
                value={draft.jewelry}
                onChange={(jewelry) => setDraft({ ...draft, jewelry })}
              />
              <ChipSelectRow
                label="Gear & Extras"
                options={ACCESSORIES}
                value={draft.accessory}
                onChange={(accessory) => setDraft({ ...draft, accessory })}
              />
            </div>
          )}

          {category === 'pose' && (
            <div className="space-y-4">
              <ChipSelectRow
                label="Expression"
                options={EXPRESSIONS}
                value={draft.expression}
                onChange={(expression) => setDraft({ ...draft, expression })}
              />
              <ChipSelectRow
                label="Bitmoji Pose"
                options={POSES}
                value={draft.pose}
                onChange={(pose) => setDraft({ ...draft, pose })}
              />
              <ColorPickerRow
                label="Backdrop Color"
                colors={BACKGROUNDS}
                value={draft.background}
                onChange={(background) => setDraft({ ...draft, background })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ChipSelectRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#A1A1A1] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
              value === opt
                ? 'bg-[#FFFC00] text-black border-[#FFFC00]'
                : 'bg-[#181818] text-white border-[#292929] hover:border-[#52525B]'
            }`}
          >
            {opt.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorPickerRow({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#A1A1A1] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={`${label} ${c}`}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
              value === c ? 'border-[#FFFC00] scale-110' : 'border-[#292929]'
            }`}
            style={{ backgroundColor: c === 'none' ? '#181818' : c }}
          >
            {c === 'none' && <span className="text-[10px] text-[#A1A1A1]">None</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
