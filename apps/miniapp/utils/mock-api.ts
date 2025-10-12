export type TemplateItem = {
  id: string;
  title: string;
  coverUrl: string;
  tags: string[];
  isPro: boolean;
  colors: string[];
  sizeHints: string[];
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
export type TemplateDetail = TemplateItem & { schema:any; author:{id:string; name:string} };
export const mockTemplateDetail: Record<string, TemplateDetail> = {
  't_001': { ...mockTemplates[0], author:{id:'u_9', name:'Molly'}, schema:{ pages:[{ width:1242, height:2208, layers:[{type:'calendar', props:{view:'month', year:2025, month:10}}]}] } },
  't_002': { ...mockTemplates[1], author:{id:'u_3', name:'Ray'},   schema:{ pages:[{ width:1080, height:1920, layers:[{type:'week', props:{weekStart:1}}]}] } },
  't_003': { ...mockTemplates[2], author:{id:'u_5', name:'Neon'},  schema:{ pages:[{ width:1242, height:2688, layers:[{type:'countdown', props:{target:'2025-12-31'}}]}] } }
};

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
