import users from "./users.js";
import items from "./items.js";

function register(req, res) {
    const { username } = req.body;

    if (!users.isValidUsername(username)) {
        res.status(400).json({ error: 'required-username' });
        return;
    }

    if (!users.isPermittedUsername(username)) {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }

    if (users.isRegisteredUser(username)) {
        res.status(409).json({ error: 'user-already-exists' });
        return;
    }

    users.registerUser(username, items.makeItemsList());
    res.json({ username });
}

export default {
    register
};
