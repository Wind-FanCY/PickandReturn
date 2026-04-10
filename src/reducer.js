import {
    LOGIN_STATUS,
    ACTIONS,
    MESSAGES,
    PAGE_STATUS
} from './constant';

export const initialState = {
    error: '',
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
                loginStatus: LOGIN_STATUS.IS_LOGGED_IN,
                username: action.username
            };
        
        case ACTIONS.LOG_OUT:
            return {
                ...state,
                error: '',
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
                isItemsPending: false,
                lastAddedItemId: '',
                items: action.items
            };
        
        case ACTIONS.REPORT_ERROR:
            return {
                ...state,
                isItemsPending: false,
                error: action.error || MESSAGES.default
            };
        
        case ACTIONS.REATURN_ITEM:
            return {
                ...state,
                lastAddedItemId: '',
                error: '',
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
                isItemsPending: false,
                lastAddedItemId: '',
                items: itemsCopy
            };
        }
            
        case ACTIONS.ADD_ITEM:
            return {
                ...state,
                error: '',
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