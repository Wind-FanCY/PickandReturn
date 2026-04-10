import {
    LOGIN_STATUS,
    ACTIONS,
    MESSAGES,
    PAGE_STATUS
} from './constant';

export const initialState = {
    error: '',
    success: '',
    username: '',
    loginStatus: LOGIN_STATUS.PENDING,
    pageStatus: PAGE_STATUS.ITEMS_PAGE,
    isItemsPending: false,
    items: {},
    lastAddedItemId: ''
};

function reducer(state, action) {
    switch (action.type) {
        case ACTIONS.LOG_IN:
            return {
                ...state,
                error: '',
                success: '',
                loginStatus: LOGIN_STATUS.IS_LOGGED_IN,
                username: action.username
            };

        case ACTIONS.LOG_OUT:
            return {
                ...state,
                error: '',
                success: '',
                username: '',
                loginStatus: LOGIN_STATUS.NOT_LOGGED_IN,
                pageStatus: PAGE_STATUS.ITEMS_PAGE,
                isItemsPending: false,
                items: {},
                lastAddedItemId: ''
            };

        case ACTIONS.CHECK_ITEMS:
            return {
                ...state,
                pageStatus: PAGE_STATUS.ITEMS_PAGE
            };

        case ACTIONS.CHECK_NOTICES:
            return {
                ...state,
                pageStatus: PAGE_STATUS.NOTICES_PAGE
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
                error: action.error || MESSAGES.default
            };

        case ACTIONS.REPORT_SUCCESS:
            return {
                ...state,
                error: '',
                success: action.message
            };

        case ACTIONS.RETURN_ITEM:
            return {
                ...state,
                lastAddedItemId: '',
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
                success: '',
                items: {
                    ...state.items,
                    [action.item.id]: action.item
                }
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

        default:
            return state;
    }
}

export default reducer;
