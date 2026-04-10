import { useContext } from "react";
import { AppContext } from "../store/app-context";
import { PAGE_STATUS } from "../store/constant";

import ItemsPage from "../features/items/ItemsPage";
import NoticesPage from "../features/notices/NoticesPage";

function MainContent() {
    const [state, dispatch] = useContext(AppContext);

    return (
        <div className="main-content">
            {state.pageStatus === PAGE_STATUS.ITEMS_PAGE && <ItemsPage />}
            {state.pageStatus === PAGE_STATUS.NOTICES_PAGE && <NoticesPage />}
        </div>
    )
}

export default MainContent;