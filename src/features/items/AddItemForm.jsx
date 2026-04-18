import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { fetchAddItem } from "../../services/services";
import { t } from "../../store/i18n";

import Status from "../../components/Status/Status";
import "./AddItemForm.css";
import addIcon from "../../assets/add_icon.png";

function AddItemForm() {
    const [state, dispatch] = useContext(AppContext);
    const [itemDetail, setItemDetail] = useState('');
    const [borrower, setBorrower] = useState('');
    const [lentDate, setLentDate] = useState('');
    const [backDate, setBackDate] = useState('');
    const [modifyLimit, setModifyLimit] = useState('3');
    const [errors, setErrors] = useState({});
    const handleInput = (setter) => (e) => setter(e.target.value);

    const lang = state.language;

    function onAddItem(itemInfo) {
        dispatch({ type: 'startLoadingItems' });
        fetchAddItem(itemInfo)
            .then(item => {
                dispatch({ type: 'addItem', item: item });
                dispatch({ type: 'reportSuccess', message: 'success.itemAdded' });
            })
            .catch(err => {
                if (err?.error === 'userNotExist') {
                    setErrors({ borrower: t(lang, 'userNotExist') });
                } else {
                    dispatch({ type: 'reportError', error: err?.error });
                }
            });
    }

    function onSubmit(e) {
        e.preventDefault();

        const newErrors = {};
        if (!itemDetail) newErrors.itemDetail = t(lang, 'add.detailRequired');
        if (!borrower) newErrors.borrower = t(lang, 'add.borrowerRequired');
        else if (borrower === state.username) newErrors.borrower = t(lang, 'add.borrowerSelf');
        if (!lentDate) newErrors.lentDate = t(lang, 'add.lentDateRequired');
        if (!backDate) newErrors.backDate = t(lang, 'add.backDateRequired');
        if (lentDate && backDate && backDate < lentDate) newErrors.dateRange = t(lang, 'add.dateRange');
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        const itemInfo = {
            itemDetail: itemDetail,
            lender: state.username,
            borrower: borrower,
            lentDate: lentDate,
            backDate: backDate,
            modifyLimit: parseInt(modifyLimit, 10)
        };
        setItemDetail('');
        setBorrower('');
        setLentDate('');
        setBackDate('');
        setModifyLimit('3');
        onAddItem(itemInfo);
    }

    return (
        <form className="add__form" onSubmit={onSubmit}>
            <label htmlFor="lender" className="add__lender">
                <span className="lender__title">{t(lang, 'add.lender')}</span>
                <input className="lender__input" type="text" value={state.username} id="lender" name="lender" disabled />
            </label>
            <label htmlFor="borrower" className="add__borrower">
                <span className="borrower__title">{t(lang, 'add.borrower')}</span>
                <input className="borrower__input" type="text" value={borrower} id="borrower" name="borrower" onChange={handleInput(setBorrower)} />
            </label>
            {errors.borrower && <span className="field-error">{errors.borrower}</span>}
            <label htmlFor="lentDate" className="add__lentDate">
                <span className="lentDate__title">{t(lang, 'add.lentDate')}</span>
                <input className="lentDate__input" type="date" value={lentDate} id="lentDate" name="lentDate" onChange={handleInput(setLentDate)} />
            </label>
            {errors.lentDate && <span className="field-error">{errors.lentDate}</span>}
            <label htmlFor="backDate" className="add__backDate">
                <span className="backDate__title">{t(lang, 'add.backDate')}</span>
                <input className="backDate__input" type="date" value={backDate} id="backDate" name="backDate" onChange={handleInput(setBackDate)} />
            </label>
            {errors.backDate && <span className="field-error">{errors.backDate}</span>}
            {errors.dateRange && <span className="field-error">{errors.dateRange}</span>}
            <label htmlFor="modifyLimit" className="add__modify-limit">
                <span className="modify-limit__title">{t(lang, 'add.modifyLimit')}</span>
                <select
                    id="modifyLimit"
                    className="modify-limit__select"
                    value={modifyLimit}
                    onChange={(e) => setModifyLimit(e.target.value)}
                >
                    <option value="-1">{t(lang, 'add.unlimited')}</option>
                    <option value="0">{t(lang, 'add.noModify')}</option>
                    <option value="1">{t(lang, 'add.1time')}</option>
                    <option value="3">{t(lang, 'add.3times')}</option>
                    <option value="5">{t(lang, 'add.5times')}</option>
                </select>
            </label>
            <label htmlFor="details" className="add__details">
                <span className="details__title">{t(lang, 'add.details')}</span>
                <input className="details__input" type="text" value={itemDetail} id="details" name="details" onChange={handleInput(setItemDetail)} />
            </label>
            {errors.itemDetail && <span className="field-error">{errors.itemDetail}</span>}
            <span className="add__tips">{t(lang, 'add.tips')}</span>
            <button className="add__button" type="submit"><img className="icon" src={addIcon} alt="add button" />{t(lang, 'add.button')}</button>
            <Status error={state.error} success={state.success} />
        </form>
    );
}

export default AddItemForm;
