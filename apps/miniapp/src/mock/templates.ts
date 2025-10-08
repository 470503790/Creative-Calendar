export type TemplateItem = {
  id: string;
  title: string;
  coverUrl: string;
  tags: string[];
  isPro: boolean;
  colors: string[];
  sizeHints: string[]; // e.g. ['A4','9:16']
};

export const mockTemplates: TemplateItem[] = [
  { id:'t_001', title:'十月·奶油风月历', coverUrl:'https://dummyimage.com/600x800/7c6cff/ffffff&text=Oct', tags:['奶油','月历','简约'], isPro:false, colors:['#7C6CFF','#FF7A59','#111'], sizeHints:['A4','9:16'] },
  { id:'t_002', title:'胶片复古·周计划', coverUrl:'https://dummyimage.com/600x800/111111/ffffff&text=Film', tags:['复古','周历'], isPro:false, colors:['#111','#FFCC00'], sizeHints:['4:5','16:9'] },
  { id:'t_003', title:'赛博·倒数日', coverUrl:'https://dummyimage.com/600x800/0ea5e9/ffffff&text=D-Count', tags:['赛博','倒数日'], isPro:true, colors:['#0ea5e9','#7C6CFF'], sizeHints:['1:1','9:16'] }
];

export type TemplateDetail = TemplateItem & {
  schema: any; // 画布场景 JSON（简化）
  author: { id:string; name:string };
};

export const mockTemplateDetail: Record<string, TemplateDetail> = {
  't_001': {
    ...mockTemplates[0],
    author: { id:'u_9', name:'Molly' },
    schema: { pages:[{ width:1242, height:2208, layers:[{type:'calendar', props:{view:'month', year:2025, month:10}}] }] }
  },
  't_002': {
    ...mockTemplates[1],
    author: { id:'u_3', name:'Ray' },
    schema: { pages:[{ width:1080, height:1920, layers:[{type:'week', props:{weekStart:1}}] }] }
  },
  't_003': {
    ...mockTemplates[2],
    author: { id:'u_5', name:'Neon' },
    schema: { pages:[{ width:1242, height:2688, layers:[{type:'countdown', props:{target:'2025-12-31'}}] }] }
  }
};
