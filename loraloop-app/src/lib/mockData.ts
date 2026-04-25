/**
 * Mock Business Data for Testing
 */

import { BusinessKnowledgeBase } from '@/types/agents';

export const mockBusiness: BusinessKnowledgeBase = {
  enrichedData: {
    brandName: 'TechFlow Studio',
    businessOverview: 'A modern digital agency specializing in web design, brand strategy, and digital marketing for startups and scale-ups. We combine strategic thinking with exceptional design to help founders build brands that matter.',
    brandValues: ['Innovation', 'Authenticity', 'Collaboration', 'Excellence', 'Growth-mindset'],
    brandAesthetic: 'Minimalist, modern, tech-forward, clean lines, bold typography, vibrant accent colors',
    toneOfVoice: 'Professional yet approachable, confident, inspiring, thought-leading, friendly',
    tagline: 'Design Meets Strategy',
    logoUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
  },

  brandGuidelines: {
    colors: {
      primary: '#0066FF',
      secondary: '#00D9FF',
      background: '#FFFFFF',
      accent: '#FF6B35',
      textHighContrast: '#1A1A1A',
    },
    typography: {
      headingFont: 'Inter Bold',
      bodyFont: 'Inter Regular',
    },
    logos: ['https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop'],
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1080&h=1080&fit=crop',
    ],
  },

  businessProfile: 'TechFlow Studio is a creative powerhouse built for digital-first brands. We work with B2B SaaS founders and marketing directors. Strategy first, design second.',
  marketResearch: 'Target: B2B SaaS founders aged 28-45. Market growing 20% YoY.',
  socialStrategy: 'Content pillars: Design inspiration (40%), Industry insights (30%), Case studies (20%), Behind-the-scenes (10%).',
};

export function getMockBusiness(type: 'design-agency' | 'tech-startup' | 'ecommerce' = 'design-agency'): BusinessKnowledgeBase {
  return mockBusiness;
}
