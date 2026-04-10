import { useContext, useState } from "react";
import { AppContext } from "./app-context";
import { fetchAddItem } from "./services";

import Status from "./Status";
import "./AddItemForm.css";
import addIcon from "./assets/add_icon.png";

function AddItemForm() {
    const [state, dispatch] = useContext(AppContext);
    const [itemDetail, setItemDetail] = useState('');
    const [borrower, setBorrower] = useState('');
    const [lentDate, setLentDate] = useState('');
    const [backDate, setBackDate] = useState('');

    function onAddItem(itemInfo) {
        dispatch({ type: 'startLoadingItems' });
        fetchAddItem(itemInfo)
            .then(item => {
                dispatch({ type: 'addItem', item: item });
            })
            .catch(err => {
                dispatch({ type: 'reportError', error: err?.error });
            });
    }

    function onSubmit(e) {
        e.preventDefault();
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
                <input className="borrower__input" type="text" value={borrower} id="borrower" name="borrower" onChange={(e) => setBorrower(e.target.value)} />
            </label>
            <label htmlFor="lentDate" className="add__lentDate">
                <span className="lentDate__title">Lent Date:</span>
                <input className="lentDate__input" type="date" value={lentDate} id="lentDate" name="lentDate" onChange={(e) => setLentDate(e.target.value)} />
            </label>
            <label htmlFor="backDate" className="add__backDate">
                <span className="backDate__title">Back Date:</span>
                <input className="backDate__input" type="date" value={backDate} id="backDate" name="backDate" onChange={(e) => setBackDate(e.target.value)} />
            </label>
            <label htmlFor="details" className="add__details">
                <span className="details__title">Item Details:</span>
                <input className="details__input" type="text" value={itemDetail} id="details" name="details" onChange={(e)=> setItemDetail(e.target.value)} />
            </label>
            <span className="add__tips">* All information needs to be filled</span>
            <button className="add__button" type="submit"><img className="icon" src={addIcon} alt="add button" />Add</button>
            {state.error && <Status error={state.error} />}
        </form>
    );
}

export default AddItemForm;