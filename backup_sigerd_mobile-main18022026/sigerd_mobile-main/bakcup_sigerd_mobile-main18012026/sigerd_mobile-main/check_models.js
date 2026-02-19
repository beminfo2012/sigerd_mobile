fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAxTyNhjuow54hCB-g_RAtRXZ52zybKgpU")
    .then(r => r.json())
    .then(data => {
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }
    })
    .catch(e => console.error(e));
