const CATEGORY_SKILL_MAP: Record<string, string[]> = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

export const categorySkillMap = CATEGORY_SKILL_MAP;

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'Development & IT', keywords: ['app', 'mobile', 'website', 'web', 'dashboard', 'system', 'platform', 'software', 'developer'] },
  { category: 'Design & Creative', keywords: ['logo', 'brand', 'design', 'ui', 'ux', 'illustration', 'poster'] },
  { category: 'Digital Marketing', keywords: ['marketing', 'seo', 'campaign', 'ads', 'social media', 'content'] },
  { category: 'Video & Animation', keywords: ['video', 'animation', 'edit', 'trailer', 'motion', 'reel'] },
  { category: 'Writing & Translation', keywords: ['write', 'blog', 'copy', 'translate', 'proofread', 'article'] },
  { category: 'Music & Audio', keywords: ['voice', 'audio', 'music', 'mix', 'master', 'singer'] },
];

export const analyzeProjectDescription = (description: string) => {
  const text = description.trim();
  const lowered = text.toLowerCase();

  const invalidPhrases = ['test', 'demo', 'sample', 'checking', 'try only'];
  if (text.length < 20 || invalidPhrases.some((phrase) => lowered.includes(phrase))) {
    return {
      isValid: false,
      category: 'General',
      skills: [],
      budget: 'Open',
      timeline: 'Flexible',
      description: text,
    };
  }

  const matchedCategory =
    CATEGORY_KEYWORDS.find((entry) => entry.keywords.some((keyword) => lowered.includes(keyword)))?.category ||
    'Design & Creative';

  const skills = CATEGORY_SKILL_MAP[matchedCategory].filter((skill) =>
    lowered.includes(skill.toLowerCase().split(' ')[0])
  );

  return {
    isValid: true,
    category: matchedCategory,
    skills: skills.length > 0 ? skills.slice(0, 3) : CATEGORY_SKILL_MAP[matchedCategory].slice(0, 3),
    budget: lowered.includes('urgent') ? 'P15,000-P30,000' : 'P5,000-P15,000',
    timeline: lowered.includes('urgent') ? '3-5 days' : '1-2 weeks',
    description: text,
  };
};

export const rankCreatorsForProject = (
  creators: any[],
  category: string,
  skills: string[],
  description: string,
  budget: string,
  timeline: string
) => {
  const normalizedSkills = skills.map((skill) => skill.toLowerCase());
  const loweredDescription = description.toLowerCase();

  return creators
    .map((creator) => {
      const creatorSkills = Array.isArray(creator.skills) ? creator.skills : [];
      const overlap = creatorSkills.filter((skill: string) =>
        normalizedSkills.some((candidate) => skill.toLowerCase() === candidate)
      ).length;
      const keywordBoost = creatorSkills.filter((skill: string) =>
        loweredDescription.includes(skill.toLowerCase().split(' ')[0])
      ).length;
      const categoryAligned = CATEGORY_SKILL_MAP[category]?.some((skill) => creatorSkills.includes(skill)) ?? false;
      const baseScore = overlap * 25 + keywordBoost * 12 + (categoryAligned ? 30 : 5);
      const experienceBoost = Math.min(Number(creator.experience_years || 0) * 3, 15);
      const score = Math.max(25, Math.min(98, baseScore + experienceBoost));

      return {
        ...creator,
        matchScore: score,
        matchReason: `Matched on ${overlap || keywordBoost ? 'relevant skills' : 'overall category fit'} for ${category.toLowerCase()}.`,
        matchStrength: creatorSkills[0] || category,
        matchConcern: score >= 80 ? '' : `Budget ${budget} and timeline ${timeline} may need confirmation.`,
        isAIRanked: false,
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore);
};
