import {
    LOGIN_STATUS,
    ACTIONS
} from './constant';
import { localPrefs } from './local-storage';

export const initialState = {
    error: '',
    success: '',
    username: '',
    loginStatus: LOGIN_STATUS.PENDING,
    isItemsPending: false,
    items: {},
    lastAddedItemId: '',
    notifications: [],
    unreadCount: 0,
    language: localPrefs.getLang()
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.LOG_IN:
            return {
                ...state,
                error: '',
                success: '',
                loginStatus: LOGIN_STATUS.IS_LOGGED_IN,
                username: action.username,
                language: action.language || state.language
            };

        case ACTIONS.LOG_OUT:
            return {
                ...state,
                error: '',
                success: '',
                username: '',
                loginStatus: LOGIN_STATUS.NOT_LOGGED_IN,
                isItemsPending: false,
                items: {},
                lastAddedItemId: '',
                notifications: [],
                unreadCount: 0
            };

        case ACTIONS.START_LOADING_ITEMS:
            return {
                ...state,
                error: '',
                isItemsPending: true
            };

        case ACTIONS.REPLACE_ITEMS:
            return {
                ...state,
                error: '',
                success: '',
                isItemsPending: false,
                lastAddedItemId: '',
                items: action.items
            };

        case ACTIONS.REPORT_ERROR:
            return {
                ...state,
                isItemsPending: false,
                success: '',
                error: action.error || 'default'
            };

        case ACTIONS.REPORT_SUCCESS:
            return {
                ...state,
                error: '',
                success: action.message
            };

        case ACTIONS.REQUEST_RETURN:
        case ACTIONS.CONFIRM_RETURN:
            return {
                ...state,
                error: '',
                success: '',
                items: {
                    ...state.items,
                    [action.item.id]: action.item
                }
            };

        case ACTIONS.SEND_NOTICE:
            return {
                ...state,
                lastAddedItemId: '',
                error: '',
                success: ''
            };

        case ACTIONS.DELETE_ITEM: {
            const itemsCopy = { ...state.items };
            delete itemsCopy[action.id];

            return {
                ...state,
                error: '',
                success: '',
                isItemsPending: false,
                lastAddedItemId: '',
                items: itemsCopy
            };
        }

        case ACTIONS.ADD_ITEM:
            return {
                ...state,
                error: '',
                success: '',
                isItemsPending: false,
                lastAddedItemId: action.item.id,
                items: {
                    ...state.items,
                    [action.item.id]: action.item
                }
            };

        case ACTIONS.REPLACE_NOTIFICATIONS: {
            const notifications = action.payload || [];
            return {
                ...state,
                notifications,
                unreadCount: notifications.filter(n => n.read === false).length
            };
        }

        case ACTIONS.DELETE_NOTIFICATION: {
            const notifications = state.notifications.filter(n => n.id !== action.payload);
            return {
                ...state,
                notifications,
                unreadCount: notifications.filter(n => n.read === false).length
            };
        }

        case ACTIONS.MARK_NOTIFICATIONS_READ: {
            const notifications = action.payload || [];
            return {
                ...state,
                notifications,
                unreadCount: 0
            };
        }

        case ACTIONS.EDIT_ITEM: {
            const item = action.payload;
            return {
                ...state,
                items: {
                    ...state.items,
                    [item.id]: item
                }
            };
        }

        case ACTIONS.MODIFY_DUE_DATE: {
            const item = action.payload;
            return {
                ...state,
                items: {
                    ...state.items,
                    [item.id]: item
                }
            };
        }

        case ACTIONS.UPDATE_MODIFY_LIMIT: {
            const item = action.payload;
            return {
                ...state,
                items: {
                    ...state.items,
                    [item.id]: item
                }
            };
        }

        case ACTIONS.TOGGLE_LANGUAGE:
            return {
                ...state,
                language: state.language === 'en' ? 'zh' : 'en'
            };

        default:
            return state;
    }
}

export default reducer;
