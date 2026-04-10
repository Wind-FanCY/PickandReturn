import { MESSAGES } from "./constant";
import "./Status.css";

function Status({ error, success }) {
    const errorMessage = MESSAGES[error] || MESSAGES.default;

    return (
        <>
            {error && <div className="status status--error">{errorMessage}</div>}
            {success && <div className="status status--success">{success}</div>}
        </>
    );
}

export default Status;
