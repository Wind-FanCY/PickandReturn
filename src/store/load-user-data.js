import { fetchItems, fetchNotifications } from '../services/services';
import { ACTIONS } from './constant';

// 登录成功 / session 恢复后共用的数据加载逻辑：拉取 items + notifications 并写入 state。
export async function loadUserData(dispatch) {
    const items = await fetchItems();
    dispatch({ type: ACTIONS.REPLACE_ITEMS, items });

    const data = await fetchNotifications();
    dispatch({ type: ACTIONS.REPLACE_NOTIFICATIONS, payload: data.notifications });
}
