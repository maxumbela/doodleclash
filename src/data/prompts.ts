import { PromptItem } from '../types/game';

export const PROMPTS: PromptItem[] = [
  {
    id: 'cat',
    emoji: '🐱',
    title: 'Cat',
    hint: 'Pointy ears, whiskers & cute nose',
    category: 'Animal',
    primaryColors: ['#f97316', '#000000', '#ffffff', '#eab308', '#94a3b8']
  },
  {
    id: 'pizza',
    emoji: '🍕',
    title: 'Pizza Slice',
    hint: 'Triangle slice, crust & pepperoni circles',
    category: 'Food',
    primaryColors: ['#eab308', '#ef4444', '#f97316', '#854d0e']
  },
  {
    id: 'rocket',
    emoji: '🚀',
    title: 'Rocket Ship',
    hint: 'Pointed nose cone, thrusters & fire blast',
    category: 'Vehicle',
    primaryColors: ['#ffffff', '#ef4444', '#3b82f6', '#f97316', '#eab308']
  },
  {
    id: 'icecream',
    emoji: '🍦',
    title: 'Ice Cream',
    hint: 'Crispy waffle cone & swirling scoop',
    category: 'Food',
    primaryColors: ['#f472b6', '#ffffff', '#854d0e', '#38bdf8', '#eab308']
  },
  {
    id: 'car',
    emoji: '🚗',
    title: 'Sports Car',
    hint: 'Sleek body, windshield & two round wheels',
    category: 'Vehicle',
    primaryColors: ['#ef4444', '#3b82f6', '#000000', '#eab308', '#64748b']
  },
  {
    id: 'burger',
    emoji: '🍔',
    title: 'Cheeseburger',
    hint: 'Two buns, beef patty, melted cheese & lettuce',
    category: 'Food',
    primaryColors: ['#d97706', '#854d0e', '#eab308', '#22c55e', '#ef4444']
  },
  {
    id: 'guitar',
    emoji: '🎸',
    title: 'Electric Guitar',
    hint: 'Hourglass body, long neck & tuning pegs',
    category: 'Music',
    primaryColors: ['#ef4444', '#8b5cf6', '#000000', '#ffffff', '#94a3b8']
  },
  {
    id: 'crown',
    emoji: '👑',
    title: 'Royal Crown',
    hint: 'Golden peaks and sparkling jewels',
    category: 'Object',
    primaryColors: ['#eab308', '#ef4444', '#3b82f6', '#a855f7']
  },
  {
    id: 'octopus',
    emoji: '🐙',
    title: 'Octopus',
    hint: 'Round head, big eyes & wavy tentacles',
    category: 'Animal',
    primaryColors: ['#ec4899', '#a855f7', '#ef4444', '#000000']
  },
  {
    id: 'sunflower',
    emoji: '🌻',
    title: 'Sunflower',
    hint: 'Brown center seed disc & bright yellow petals',
    category: 'Nature',
    primaryColors: ['#eab308', '#854d0e', '#22c55e', '#15803d']
  },
  {
    id: 'ghost',
    emoji: '👻',
    title: 'Ghost',
    hint: 'Floating sheet body, wavy bottom & spooky eyes',
    category: 'Fantasy',
    primaryColors: ['#ffffff', '#000000', '#94a3b8', '#a855f7']
  },
  {
    id: 'gamepad',
    emoji: '🎮',
    title: 'Gaming Controller',
    hint: 'Two grips, D-pad, thumbsticks & buttons',
    category: 'Tech',
    primaryColors: ['#000000', '#3b82f6', '#ef4444', '#10b981', '#ffffff']
  },
  {
    id: 'watermelon',
    emoji: '🍉',
    title: 'Watermelon Slice',
    hint: 'Green rind, bright red flesh & black seeds',
    category: 'Food',
    primaryColors: ['#ef4444', '#22c55e', '#000000', '#15803d', '#ffffff']
  },
  {
    id: 'cactus',
    emoji: '🌵',
    title: 'Desert Cactus',
    hint: 'Spiky green stem with raised arms',
    category: 'Nature',
    primaryColors: ['#22c55e', '#15803d', '#eab308', '#854d0e']
  },
  {
    id: 'diamond',
    emoji: '💎',
    title: 'Shining Diamond',
    hint: 'Faceted gem with flat top & angled point',
    category: 'Object',
    primaryColors: ['#06b6d4', '#38bdf8', '#ffffff', '#3b82f6']
  },
  {
    id: 'donut',
    emoji: '🍩',
    title: 'Glazed Donut',
    hint: 'Torus ring with pink frosting & colorful sprinkles',
    category: 'Food',
    primaryColors: ['#ec4899', '#d97706', '#ffffff', '#eab308', '#38bdf8']
  }
];

export function getRandomPrompts(count: number = 5, category: string = 'all'): PromptItem[] {
  let pool = PROMPTS;
  if (category && category !== 'all') {
    const filtered = PROMPTS.filter(p => p.category.toLowerCase() === category.toLowerCase());
    if (filtered.length >= count) {
      pool = filtered;
    } else if (filtered.length > 0) {
      // If category has fewer items than total rounds, include all of them and pad with others
      const others = PROMPTS.filter(p => p.category.toLowerCase() !== category.toLowerCase());
      pool = [...filtered, ...others];
    }
  }
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

