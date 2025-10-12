export type TemplateItem = {
  id: string;
  title: string;
  coverUrl: string;
  tags: string[];
  isPro: boolean;
  colors: string[];
  sizeHints: string[];
  description?: string;
};

export type TemplateSizeOption = {
  key: string;
  label: string;
  width: number;
  height: number;
  ratioLabel: string;
  hint?: string;
};

export type HomeGreeting = {
  title: string;
  subtitle: string;
  tagline: string;
};

export type HomeTodayCard = {
  dateLabel: string;
  week: string;
  lunar: string;
  focus: string;
  reminder: string;
};

export type HomeResponse = {
  greeting: HomeGreeting;
  today: HomeTodayCard;
  templates: TemplateItem[];
};
export const mockTemplates: TemplateItem[] = [
  { id:'t_001', title:'十月·奶油风月历', coverUrl:'https://dummyimage.com/600x800/7c6cff/ffffff&text=Oct', tags:['奶油','月历','简约'], isPro:false, colors:['#7C6CFF','#FF7A59','#111'], sizeHints:['A4','9:16'] },
  { id:'t_002', title:'胶片复古·周计划', coverUrl:'https://dummyimage.com/600x800/111111/ffffff&text=Film', tags:['复古','周历'], isPro:false, colors:['#111','#FFCC00'], sizeHints:['4:5','16:9'] },
  { id:'t_003', title:'赛博·倒数日', coverUrl:'https://dummyimage.com/600x800/0ea5e9/ffffff&text=D-Count', tags:['赛博','倒数日'], isPro:true, colors:['#0ea5e9','#7C6CFF'], sizeHints:['1:1','9:16'] }
];
export type TemplateDetail = TemplateItem & {
  schema: any;
  author: { id: string; name: string; avatarUrl?: string };
  sizes: TemplateSizeOption[];
  isFavorite?: boolean;
};

const SIZE_PRESETS: Record<string, TemplateSizeOption> = {
  'A4': {
    key: 'preset-a4-portrait',
    label: 'A4 竖版',
    width: 2480,
    height: 3508,
    ratioLabel: '1:1.41',
    hint: '打印友好，适合月历海报',
  },
  'A3': {
    key: 'preset-a3-portrait',
    label: 'A3 竖版',
    width: 3508,
    height: 4961,
    ratioLabel: '1:1.41',
    hint: '线下展示、展板首选',
  },
  '9:16': {
    key: 'preset-9-16',
    label: '手机竖屏',
    width: 1080,
    height: 1920,
    ratioLabel: '9:16',
    hint: '社交平台竖屏展示',
  },
  '4:5': {
    key: 'preset-4-5',
    label: '相册 4:5',
    width: 1080,
    height: 1350,
    ratioLabel: '4:5',
    hint: '适合平台图文封面',
  },
  '16:9': {
    key: 'preset-16-9',
    label: '横屏海报',
    width: 1920,
    height: 1080,
    ratioLabel: '16:9',
    hint: '横屏展示、投影推荐',
  },
  '1:1': {
    key: 'preset-1-1',
    label: '正方形',
    width: 1200,
    height: 1200,
    ratioLabel: '1:1',
    hint: '方形相册、商品卡片',
  },
}

function buildSchemaSize(schema: any) {
  const page = schema?.pages?.[0];
  const width = Number(page?.width) || 1080;
  const height = Number(page?.height) || 1920;
  return { width, height };
}

function buildBaseSizeOption(schema: any): TemplateSizeOption {
  const { width, height } = buildSchemaSize(schema);
  const ratio = height && width ? (height / width).toFixed(2) : '1.78';
  return {
    key: 'base-origin',
    label: '原始尺寸',
    width,
    height,
    ratioLabel: `≈1:${ratio}`,
    hint: '模板默认比例，推荐直接使用',
  };
}

function buildSizeOptions(sizeHints: string[], schema: any): TemplateSizeOption[] {
  const options: TemplateSizeOption[] = [];
  const seen = new Set<string>();
  const base = buildBaseSizeOption(schema);
  options.push(base);
  seen.add(base.key);

  sizeHints.forEach((hint) => {
    const preset = SIZE_PRESETS[hint];
    if (!preset || seen.has(preset.key)) return;
    seen.add(preset.key);
    options.push({ ...preset });
  });

  return options;
}

function makeDetail(item: TemplateItem, config: { schema: any; author: { id: string; name: string; avatarUrl?: string } }): TemplateDetail {
  const schema = config.schema;
  const sizes = buildSizeOptions(item.sizeHints, schema);
  return {
    ...item,
    schema,
    author: config.author,
    sizes,
  };
}

export const mockTemplateDetail: Record<string, TemplateDetail> = {
  't_001': makeDetail(mockTemplates[0], {
    author: { id: 'u_9', name: 'Molly' },
    schema: {
      pages: [
        {
          width: 1242,
          height: 2208,
          layers: [{ type: 'calendar', props: { view: 'month', year: 2025, month: 10 } }],
        },
      ],
    },
  }),
  't_002': makeDetail(mockTemplates[1], {
    author: { id: 'u_3', name: 'Ray' },
    schema: {
      pages: [
        {
          width: 1080,
          height: 1920,
          layers: [{ type: 'week', props: { weekStart: 1 } }],
        },
      ],
    },
  }),
  't_003': makeDetail(mockTemplates[2], {
    author: { id: 'u_5', name: 'Neon' },
    schema: {
      pages: [
        {
          width: 1242,
          height: 2688,
          layers: [{ type: 'countdown', props: { target: '2025-12-31' } }],
        },
      ],
    },
  }),
}

const weekMap = ['日', '一', '二', '三', '四', '五', '六'];

function buildGreeting(): HomeGreeting {
  const now = new Date();
  const hour = now.getHours();
  let title = '你好';
  if (hour >= 5 && hour < 12) title = '早上好';
  else if (hour >= 12 && hour < 14) title = '中午好';
  else if (hour >= 14 && hour < 19) title = '下午好';
  else if (hour >= 19 || hour < 5) title = '晚上好';

  return {
    title,
    subtitle: '欢迎回来，开启今日的灵感创作',
    tagline: '灵感随手记，卡片即刻成型',
  };
}

function buildTodayCard(now: Date): HomeTodayCard {
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const week = weekMap[now.getDay()];

  return {
    dateLabel: `${month}月${date}日`,
    week: `星期${week}`,
    lunar: '农历二月初六 · 惊蛰',
    focus: '今日主打 · 品牌月历焕新',
    reminder: '适合制作节日主题、倒数日、周计划模板',
  };
}

export async function getHome(): Promise<HomeResponse> {
  const now = new Date();
  return {
    greeting: buildGreeting(),
    today: buildTodayCard(now),
    templates: mockTemplates,
  };
}
export async function getTemplates(){ return mockTemplates }
export async function getTemplateDetail(id:string){ return mockTemplateDetail[id] }
export async function createProjectFromTemplate(tplId: string){ return { projectId: `p_${tplId}_${Date.now()}` } }
