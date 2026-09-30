export type MoodId = 'happy' | 'calm' | 'tired' | 'angry'
export type SceneId = 'home' | MoodId

export type RainConfig = {
  density: number
  speed: number
  angle: number
  length: number
  opacity: number
  splash?: boolean
}

export type Scene = {
  id: SceneId
  image: string
  alt: string
  title: string
  caption: string
  imageFilter: string
  rain?: RainConfig
}

export const scenes: Record<SceneId, Scene> = {
  home: {
    id: 'home',
    image: '/scenes/home.png',
    alt: 'A painted countryside garden with a small cottage under soft rain',
    title: 'The Garden',
    caption: 'Rain taps softly on the leaves.',
    imageFilter: 'saturate(0.95) brightness(0.92)',
    rain: { density: 260, speed: 13, angle: 0, length: 18, opacity: 0.4 },
  },
  happy: {
    id: 'happy',
    image: '/scenes/happy.png',
    alt: 'A sunny meadow full of colorful wildflowers under fluffy clouds',
    title: 'Happiness',
    caption: 'The whole field bloomed just for you.',
    imageFilter: 'saturate(1.1) brightness(1.03)',
  },
  calm: {
    id: 'calm',
    image: '/scenes/calm.png',
    alt: 'A wide green meadow with tall grass swaying under a pale sky',
    title: 'Calm',
    caption: 'Breathe in. Let the wind carry the rest.',
    imageFilter: 'saturate(1) brightness(1)',
  },
  tired: {
    id: 'tired',
    image: '/scenes/tired.png',
    alt: 'A misty mountain in light drizzle with a small warm cabin at its base',
    title: 'Tired',
    caption: 'It is okay to rest. The mountain will wait.',
    imageFilter: 'saturate(0.7) brightness(0.88) contrast(0.95)',
    rain: { density: 110, speed: 6, angle: 0, length: 10, opacity: 0.28 },
  },
  angry: {
    id: 'angry',
    image: '/scenes/angry-new.png',
    alt: 'A dark ancient forest bending under a heavy thunderstorm',
    title: 'Angry',
    caption: 'Let the storm roar. It will pass.',
    imageFilter: 'saturate(0.85) brightness(0.78) contrast(1.1)',
    rain: { density: 350, speed: 24, angle: 0, length: 30, opacity: 0.5, splash: false },
  },
}

export const moodOrder: MoodId[] = ['happy', 'calm', 'tired', 'angry']
