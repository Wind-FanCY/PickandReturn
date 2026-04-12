export const LOGIN_STATUS = {
    PENDING: 'pending',
    NOT_LOGGED_IN: 'notLoggedIn',
    IS_LOGGED_IN: 'loggedIn'
};

export const PAGE_STATUS = {
    ITEMS_PAGE: 'itemsPage',
    NOTICES_PAGE: 'noticesPage',
    RETURN_PAGE: 'returnPage'
};

export const SERVER = {
    AUTH_MISSING: 'auth-missing',
    AUTH_INSUFFICIENT: 'auth-insufficient',
    REQUIRED_USERNAME: 'required-username',
    REQUIRED_ITEM: 'required-item',
    ITEM_MISSING: 'item-missing',
    USER_NOT_EXIST: 'userNotExist',
    USER_NOT_REGISTERED: 'user-not-registered',
    USER_ALREADY_EXISTS: 'user-already-exists'
};

export const CLIENT = {
    NETWORK_ERROR: 'networkError',
    NO_SESSION: 'noSession'
};

export const ACTIONS = {
    LOG_IN: 'logIn',
    LOG_OUT: 'logOut',
    CHECK_ITEMS: 'checkItems',
    CHECK_NOTICES: 'checkNotices',
    CHECK_RETURN: 'checkReturn',
    START_LOADING_ITEMS: 'startLoadingItems',
    REPLACE_ITEMS: 'replaceItems',
    REPORT_ERROR: 'reportError',
    REPORT_SUCCESS: 'reportSuccess',
    RETURN_ITEM: 'returnItem',
    DELETE_ITEM: 'deleteItem',
    ADD_ITEM: 'addItem',
    SEND_NOTICE: 'sendNotice',
    REPLACE_NOTIFICATIONS: 'replaceNotifications',
    DELETE_NOTIFICATION: 'deleteNotification',
    MARK_NOTIFICATIONS_READ: 'markNotificationsRead',
    EDIT_ITEM: 'editItem',
    MODIFY_DUE_DATE: 'modifyDueDate',
    UPDATE_MODIFY_LIMIT: 'updateModifyLimit'
};

export const NOTIFICATION_TYPE = {
    RETURN_REMINDER: 'return_reminder',
    DATE_MODIFIED: 'date_modified'
};

export const SHOW = {
    PENDING: 'pending',
    EMPTY: 'empty',
    EXIST: 'exist'
};

export const MESSAGES = {
    [CLIENT.NETWORK_ERROR]: 'Trouble connecting to the network. Please try again',
    [SERVER.AUTH_INSUFFICIENT]: 'Username "dog" is not allowed',
    [SERVER.REQUIRED_USERNAME]: 'Please enter a valid username (only a-z, A-Z, 0-9 and _)',
    [SERVER.REQUIRED_ITEM]: 'Please offer all information',
    [SERVER.ITEM_MISSING]: 'Unable to find the relevant information',
    [SERVER.USER_NOT_EXIST]: 'Borrower is not in the system',
    [SERVER.USER_NOT_REGISTERED]: 'Username not found. Please register first.',
    [SERVER.USER_ALREADY_EXISTS]: 'Username already taken. Please log in.',
    default: 'Something went wrong. Please try again'
};

export const FORM_MODE = {
    LOGIN: 'login',
    REGISTER: 'register'
};
