
import React from 'react';
import { StylePreset } from './types';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-infused futuristic streetwear',
    prompt: 'Change my outfit to a high-fashion cyberpunk streetwear look with neon accents, tech-wear materials, and glowing futuristic details.',
    icon: '🚀'
  },
  {
    id: 'formal',
    name: 'Executive',
    description: 'Sharp tailored business attire',
    prompt: 'Change my outfit to a perfectly tailored, expensive-looking charcoal grey business suit with a crisp white shirt and silk tie.',
    icon: '💼'
  },
  {
    id: 'bohemian',
    name: 'Boho Chic',
    description: 'Flowy, artistic, and relaxed',
    prompt: 'Change my outfit to a stylish bohemian look with flowy fabrics, earthy tones, layered accessories, and artistic patterns.',
    icon: '🎨'
  },
  {
    id: 'regal',
    name: 'Royal Gala',
    description: 'Elegant evening formal wear',
    prompt: 'Change my outfit to a breathtaking royal gala evening gown/tuxedo with gold embroidery and premium velvet textures.',
    icon: '👑'
  },
  {
    id: 'sporty',
    name: 'Athleisure',
    description: 'Premium performance gear',
    prompt: 'Change my outfit to high-end designer athletic wear with modern breathable fabrics and sleek performance aesthetics.',
    icon: '🏃'
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Victorian industrial fantasy',
    prompt: 'Change my outfit to an elaborate steampunk ensemble with leather corsetry/vests, brass gears, and Victorian industrial elements.',
    icon: '⚙️'
  }
];
