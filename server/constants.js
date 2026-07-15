// 共享的业务魔数常量。

// modifyLimit === -1 表示借阅方可无限次修改归还日期。
export const MODIFY_UNLIMITED = -1;

// 新建 Item 时，出借方未指定 modifyLimit 的默认上限。
export const DEFAULT_MODIFY_LIMIT = 3;

// itemDetail 最大长度，防止超长文本撑爆存储（M2）。
export const MAX_ITEM_DETAIL_LENGTH = 200;

// 同一 item 两次手动提醒之间的最小间隔（毫秒），防止提醒轰炸（M1）。
export const REMIND_COOLDOWN_MS = 60 * 60 * 1000;
