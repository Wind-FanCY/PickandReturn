// 轻量本地敏感词过滤:履行 UGC 内容管理的"合理注意义务"（《网络安全法》第 47 条）。
// 定位:把项目从"零过滤"提升到"已做基础防护"——机制比词库穷尽更重要。
// 生产级鉴黄/鉴政应接入阿里云内容安全等服务（与 ECS 同为境内，不涉数据出境），
// 此处不引入以控制个人项目成本。词库按需增补，政治/暴恐类应以官方权威名单为准。

// 归一化:拉丁字母转小写 + 去掉常见分隔符，降低"夹字/空格/符号"式绕过。
function normalize(text) {
    return text.toLowerCase().replace(/[\s.·*\-_~、,，]/g, '');
}

// 起步词库，按类别组织便于维护。色情/赌博/诈骗广告类为常见可枚举项；
// 政治敏感/暴恐类仅列少量公认条目，实际应从官方权威名单补全。
const SENSITIVE_WORDS = [
    // 邪教 / 政治敏感（示例，按官方名单增补）
    '法轮功',
    // 色情
    '色情', '裸聊', 'av女优',
    // 赌博
    '赌博', '博彩', '菠菜网', '开户送',
    // 诈骗 / 垃圾广告
    '代开发票', '办理证件', '刷单返现', '一元夺宝',
    // 英文垃圾 / 辱骂（用户名为 ASCII，需拉丁词才拦得住；已归一化转小写）
    'fuck', 'shit', 'porn', 'viagra', 'casino',
];

const NORMALIZED = SENSITIVE_WORDS.map(normalize).filter(Boolean);

// 文本是否命中任一敏感词。空/非字符串视为不命中（交由各自的必填校验处理）。
export function containsSensitiveWord(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    const normalized = normalize(text);
    return NORMALIZED.some((word) => normalized.includes(word));
}
