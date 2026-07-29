export async function loadTricks() {
    const response = await fetch("./data/tricks.json");

    if (!response.ok) {
        throw new Error("The trick database could not be loaded.");
    }

    return response.json();
}