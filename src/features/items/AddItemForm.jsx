import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { fetchAddItem } from "../../services/services";

import Status from "../../components/Status/Status";
import "./AddItemForm.css";
import addIcon from "../../assets/add_icon.png";

function AddItemForm() {
    const [state, dispatch] = useContext(AppContext);
    const [itemDetail, setItemDetail] = useState('');
    const [borrower, setBorrower] = useState('');
    const [lentDate, setLentDate] = useState('');
    const [backDate, setBackDate] = useState('');
    const [errors, setErrors] = useState({});
    const handleInput = (setter) => (e) => setter(e.target.value);

    function onAddItem(itemInfo) {
        dispatch({ type: 'startLoadingItems' });
        fetchAddItem(itemInfo)
            .then(item => {
                dispatch({ type: 'addItem', item: item });
                dispatch({ type: 'reportSuccess', message: 'Item added successfully!' });
            })
            .catch(err => {
                if (err?.error === 'userNotExist') {
                    setErrors({ borrower: 'Borrower is not in the system' });
                } else {
                    dispatch({ type: 'reportError', error: err?.error });
                }
            });
    }

    function onSubmit(e) {
        e.preventDefault();

        const newErrors = {};
        if (!itemDetail) newErrors.itemDetail = 'Item details are required';
        if (!borrower) newErrors.borrower = 'Borrower is required';
        else if (borrower === state.username) newErrors.borrower = 'You cannot lend to yourself';
        if (!lentDate) newErrors.lentDate = 'Lent date is required';
        if (!backDate) newErrors.backDate = 'Due date is required';
        if (lentDate && backDate && backDate < lentDate) newErrors.dateRange = 'Due date must be on or after lent date';
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
        };
        setItemDetail('');
        setBorrower('');
        setLentDate('');
        setBackDate('');
        onAddItem(itemInfo);
    }

    return (
        <form className="add__form" onSubmit={onSubmit}>
            <label htmlFor="lender" className="add__lender">
                <span className="lender__title">Lender:</span>
                <input className="lender__input" type="text" value={state.username} id="lender" name="lender" disabled />
            </label>
            <label htmlFor="borrower" className="add__borrower">
                <span className="borrower__title">Borrower:</span>
                <input className="borrower__input" type="text" value={borrower} id="borrower" name="borrower" onChange={handleInput(setBorrower)} />
            </label>
            {errors.borrower && <span className="field-error">{errors.borrower}</span>}
            <label htmlFor="lentDate" className="add__lentDate">
                <span className="lentDate__title">Lent Date:</span>
                <input className="lentDate__input" type="date" value={lentDate} id="lentDate" name="lentDate" onChange={handleInput(setLentDate)} />
            </label>
            {errors.lentDate && <span className="field-error">{errors.lentDate}</span>}
            <label htmlFor="backDate" className="add__backDate">
                <span className="backDate__title">Back Date:</span>
                <input className="backDate__input" type="date" value={backDate} id="backDate" name="backDate" onChange={handleInput(setBackDate)} />
            </label>
            {errors.backDate && <span className="field-error">{errors.backDate}</span>}
            {errors.dateRange && <span className="field-error">{errors.dateRange}</span>}
            <label htmlFor="details" className="add__details">
                <span className="details__title">Item Details:</span>
                <input className="details__input" type="text" value={itemDetail} id="details" name="details" onChange={handleInput(setItemDetail)} />
            </label>
            {errors.itemDetail && <span className="field-error">{errors.itemDetail}</span>}
            <span className="add__tips">* All information needs to be filled</span>
            <button className="add__button" type="submit"><img className="icon" src={addIcon} alt="add button" />Add</button>
            <Status error={state.error} success={state.success} />
        </form>
    );
}

export default AddItemForm;
